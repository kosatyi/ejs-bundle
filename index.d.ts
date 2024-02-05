import type { Plugin } from 'rollup'

export interface EjsConfig {
    path?: string
    export?: string | 'ejsPrecompiled'
    extension?: 'ejs'
    withObject?: false
    [key: string]: any
}

export interface BundlerOptions {
    target: string[] | string
    transform?: boolean
    minify?: boolean
}

export interface WatcherOptions {
    dir: string
    pattern?: string
}

export function bundle(options: BundlerOptions, config: EjsConfig): Promise<any>

export function ejsBundle(options: BundlerOptions, config: EjsConfig): Plugin

export function ejsWatch(options: WatcherOptions): Plugin

export class Bundler {
    new(options: BundlerOptions, config: EjsConfig): Bundler
}
