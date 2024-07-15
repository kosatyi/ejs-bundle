#! /usr/bin/env node

import argv from 'process.argv'

import { bundle } from '../dist/esm/index.js'

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

await bundle(
    {
        target: params.target,
        transform: params.transform,
        timestamp: params.timestamp,
        minify: params.minify,
    },
    {
        withObject: params.withObject,
        path: params.path,
        export: params.export,
        extension: params.extension,
    }
).then(() => {
    console.log('bundle complete', params.target)
})
