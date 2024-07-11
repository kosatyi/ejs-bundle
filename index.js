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

const ejsWatchOptions = {
    pattern: '**/*.ejs',
}

export class Bundler {
    /**
     * @type {BundlerOptions}
     */
    options = {
        target: [],
        transform: true,
        minify: true,
        timestamp: true,
    }
    /**
     * @type {EjsConfig}
     */
    config = {}
    constructor(options, config) {
        extend(this.options, options || {})
        this.config = configure(config || {})
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
        const config = {
            presets: [['@babel/preset-env']],
            sourceType: 'script',
        }
        const response = await babel.transformAsync(content, config)
        return response.code
    }
    getBundle() {
        const transform = this.options.transform
        const moduleId = this.config.export
        const useStrict = this.config.withObject === false
        const timestamp = this.options.timestamp
        const out = []
        if (transform) {
            out.push('(function(global,factory){')
            out.push(
                'typeof exports === "object" && typeof module !== "undefined" ?'
            )
            out.push('module.exports = factory():')
            out.push(
                'typeof define === "function" && define.amd ? define(factory):'
            )
            out.push(
                '(global = typeof globalThis !== "undefined" ? globalThis:'
            )
            out.push('global || self,global["' + moduleId + '"] = factory())')
            out.push('})(this,(function(){')
        }
        if (useStrict) out.push("'use strict'")
        if (timestamp) out.push('const timestamp = '.concat(String(Date.now())))
        out.push('const templates = {}')
        Object.entries(this.templates).forEach(([name, content]) => {
            name = JSON.stringify(name)
            content = String(content)
            out.push(`templates[${name}] = ${content}`)
        })
        if (transform) {
            out.push('return templates')
            out.push('}))')
        } else {
            out.push('export default templates')
        }
        return out.join('\n')
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
 * @param {BundlerOptions|Object<string,any>} options
 * @param {EjsConfig|Object<string,any>} [config]
 * @returns {Promise<void>}
 */
export const bundle = async (options, config) => {
    const bundler = new Bundler(options, config)
    await bundler.concat()
    await bundler.output()
}
/**
 *
 * @param {BundlerOptions|Object<string,any>} options
 * @param {EjsConfig|Object<string,any>} [config]
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

/**
 *
 * @param {WatcherOptions} options
 * @returns {*}
 */
export const ejsWatch = (options) => {
    const { dir, pattern } = Object.assign({}, ejsWatchOptions, options)
    return {
        name: 'watch',
        async buildStart() {
            const list = await glob(pattern, { cwd: dir })
            for (let file of list) {
                this.addWatchFile(join(dir, file))
            }
        },
    }
}
