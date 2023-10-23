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
}
