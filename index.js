import { promises as fs } from 'fs'
import { glob } from 'glob'
import { dirname, join } from 'path'
import { minify } from 'terser'
import { compile, configure } from '@kosatyi/ejs'
import babel from '@babel/core'

const isPlainObject = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Object]'
}

const extend = (target, ...sources) => {
    return Object.assign(target, ...sources.filter(isPlainObject))
}

export class Bundler {
    /**
     * @type {BundlerOptions}
     */
    options = {
        target: [],
        transform: 'umd',
        minify: true,
    }
    /**
     * @type {EjsConfig}
     */
    config = {}
    constructor(options, config) {
        extend(this.options, options)
        this.config = configure(config)
        this.templates = {}
    }
    stageRead(path) {
        return fs
            .readFile(join(this.config.path, path))
            .then((response) => response.toString())
    }
    stageCompile(content, name) {
        return compile(content, name).source
    }
    async stageMinify(content) {
        if (this.options.minify === false) return content
        const config = {
            compress: {
                dead_code: false,
                side_effects: false,
            },
        }
        const response = await minify(content, config)
        return response.code
    }
    async stageTransform(content) {
        if (this.options.transform === false) return content
        const modules = this.options.transform
        const strictMode = !!this.config.withObject
        const moduleId = this.config.export
        const config = {
            presets: [['@babel/preset-env', { modules }]],
            plugins: [['@babel/plugin-transform-modules-umd', { moduleId }]],
            parserOpts: { strictMode },
        }
        const response = await babel.transformAsync(content, config)
        return response.code
    }
    getBundle() {
        const output = []
        output.push('const templates = {}')
        Object.entries(this.templates).forEach(([name, content]) => {
            name = JSON.stringify(name)
            content = String(content)
            output.push(`templates[${name}] = ${content}`)
        })
        if (this.options.transform) output.push('export default templates')
        else output.push('export { templates }')
        return output.join('\n')
    }
    async concat() {
        const pattern = '**/*.'.concat(this.config.extension)
        const list = await glob(pattern, { cwd: this.config.path })
        for (let template of list) {
            let content = ''
            content = await this.stageRead(template)
            content = await this.stageCompile(content, template)
            this.templates[template] = content
        }
    }
    async output() {
        const target = [].concat(this.options.target)
        let content = this.getBundle()
        if (this.options.transform) {
            content = await this.stageTransform(content)
        }
        if (this.options.minify) {
            content = await this.stageMinify(content)
        }
        for (let file of target) {
            const folderPath = dirname(file)
            const folderExists = await fs
                .stat(folderPath)
                .then(() => true)
                .catch(() => false)
            if (folderExists === false) {
                await fs.mkdir(folderPath, { recursive: true })
            }
            await fs.writeFile(file, content)
        }
    }
}

/**
 *
 * @param {BundlerOptions} options
 * @param {EjsConfig} config
 * @returns {Promise<void>}
 */
export const bundle = async (options, config) => {
    const bundler = new Bundler(options, config)
    await bundler.concat()
    await bundler.output()
}
/**
 *
 * @param {BundlerOptions} options
 * @param {EjsConfig} config
 * @returns {*}
 */
export const ejsBundle = (options, config) => {
    const bundler = new Bundler(options, config)
    return {
        name: 'ejs-bundle',
        async buildStart() {
            await bundler.concat()
        },
        async buildEnd() {
            await bundler.output()
        },
    }
}
