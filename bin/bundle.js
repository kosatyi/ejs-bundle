#! /usr/bin/env node

import argv from 'process.argv'

import { bundle } from '../index.js'

const schema = argv(process.argv.slice(2))

/**
 *
 * @type {BundlerOptions}
 */
const params = schema({
    target: null,
    transform: false,
    timestamp: true,
    minify: false,
})

if (typeof params.target !== 'string') {
    throw new Error('target is not a string')
}

/**
 *
 * @type {EjsConfig}
 */
const config = {
    withObject: false,
}

await bundle(params, config).then(() => {
    console.log('bundle complete', params.target)
})
