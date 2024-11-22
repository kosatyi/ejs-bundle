#! /usr/bin/env node
import { watch } from 'fs'
import { resolve, extname } from 'path'
import argv from 'process.argv'

import { Bundler } from '../dist/esm/index.js'

const schema = argv(process.argv.slice(2))

const params = schema({
    target: null,
    transform: false,
    timestamp: true,
    minify: false,
    withObject: false,
    export: 'ejsPrecompiled',
    path: 'views',
    extension: 'ejs',
})

if (typeof params.target !== 'string') {
    throw new Error('target is not a string')
}

const options = {
    target: params.target,
    transform: params.transform,
    timestamp: params.timestamp,
    minify: params.minify,
}
const config = {
    withObject: params.withObject,
    path: params.path,
    export: params.export,
    extension: params.extension,
}

const timeoutCallback = (callback, idle) => {
    let context = null
    return (...args) => {
        clearTimeout(context)
        context = setTimeout(callback, idle, ...args)
    }
}

const bundler = new Bundler(options, config)

if (params.watch && params.path) {
    await bundler.watch()
} else {
    await bundler.build()
}
