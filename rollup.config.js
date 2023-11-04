import { promises as fs } from 'fs'

export default {
    input: 'index.js',
    output: [
        {
            file: 'dist/esm/index.js',
            format: 'esm',
        },
        {
            file: 'dist/cjs/index.js',
            format: 'cjs',
        },
    ],
    external: ['fs', 'path', 'glob', 'terser', '@kosatyi/ejs', '@babel/core'],
    plugins: [
        {
            name: 'jsonFile',
            async buildEnd(err) {
                if (!err) {
                    await fs.mkdir('dist/cjs', { recursive: true })
                    await fs.writeFile(
                        'dist/cjs/package.json',
                        JSON.stringify({ type: 'commonjs' }, null, 4)
                    )
                }
            },
        },
    ],
}
