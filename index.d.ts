import type { Plugin } from 'rollup'

export interface EjsConfig {
    path?: string
    export?: string | 'ejsPrecompile'
    extension?: 'ejs'
    withObject?: false
    [key: string]: any
}

export interface BundlerOptions {
    target: string[] | string
    transform?: 'commonjs' | 'esm' | 'amd' | false
    minify?: boolean
}

export function bundle(options: BundlerOptions, config: EjsConfig): Promise<any>

export function ejsBundle(options: BundlerOptions, config: EjsConfig): Plugin

export class Bundler {
    new(options: BundlerOptions, config: EjsConfig): Bundler
}
