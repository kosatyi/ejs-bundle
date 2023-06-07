import type { Plugin } from 'rollup'
import type { MinifyOptions } from 'terser'

interface ejsBundleItem {
    name: string
    content: string
}

type Wrapper = (list: ejsBundleItem[]) => string
type Compile = (content: string, name: string) => string

export interface ejsBundleConfig {
    folder: string
    target: string
    compile?: Compile
    wrapper?: Wrapper
    extension?: string
    transform?: object
    minify?: MinifyOptions
}

export function bundle(config: ejsBundleConfig): Promise<any>

export function ejsBundle(config: ejsBundleConfig): Plugin
