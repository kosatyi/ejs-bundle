import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { glob } from 'glob'
import { minify } from 'terser'
import babel from '@babel/core'

const babelConfig = {
    presets: [['@babel/preset-env', { modules: false }]],
    parserOpts: {
        strictMode: false,
    },
}

const minifyConfig = {
    compress: {
        dead_code: false,
        side_effects: false,
    },
}

const stageRead = (folder, name) => {
    return fs
        .readFile(join(folder, name))
        .then((response) => response.toString())
}

const stageCompile = (compile, content, name) => {
    return compile(content, name).source
}

const stageTransform = (content, config = {}) => {
    return babel
        .transformAsync(content, Object.assign({}, babelConfig, config))
        .then((response) => response.code)
}

const stageMinify = (content, config = {}) => {
    return minify(content, Object.assign({}, minifyConfig, config)).then(
        (response) => response.code
    )
}
/**
 *
 * @param {ejsBundleConfig} config
 * @returns {Promise<void>}
 */
export const bundle = async (config) => {
    const {
        extension = 'ejs',
        compile,
        wrapper,
        folder,
        target,
        transform = {},
        minify = {},
    } = config
    const pattern = '**/*.'.concat(extension)
    const list = await glob(pattern, { cwd: folder })
    const result = list.map(async (name) => {
        let content = ''
        content = await stageRead(folder, name)
        content = await stageCompile(compile, content, name)
        return { name, content }
    })
    const files = await Promise.all(result)
    const targetPath = dirname(target)
    const folderExists = await fs
        .stat(targetPath)
        .then((o) => true)
        .catch((e) => false)
    if (folderExists === false) {
        await fs.mkdir(targetPath, { recursive: true })
    }
    let content = wrapper(files)
    if (transform) content = await stageTransform(content, transform)
    if (minify) content = await stageMinify(content, minify)
    await fs.writeFile(target, content)
}

export const ejsBundle = (config) => {
    return {
        name: 'ejs-bundle',
        async buildStart() {
            await bundle(config)
        },
    }
}
