export default {
    input: 'index.js',
    output: [
        {
            file: 'dist/esm/index.mjs',
            format: 'esm',
        },
        {
            file: 'dist/cjs/index.cjs',
            format: 'cjs',
        },
    ],
    external: ['fs', 'path', 'glob', 'terser', '@kosatyi/ejs', '@babel/core'],
}
