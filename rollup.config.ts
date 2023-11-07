import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import cleanup from 'rollup-plugin-cleanup';
import { preserveShebangs } from 'rollup-plugin-preserve-shebangs';

const commonExternal = [
    'fs',
    'path',
    'commander',
    'crypto',
];

const commonPlugins = [
    // Allow json resolution
    json(),

    // Compile TypeScript files
    typescript(),

    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs({ sourceMap: false }),

    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve({ preferBuiltins: false }),

    cleanup({ comments: ['srcmaps'] }),
];

// output as cli
const cliConfig = defineConfig({
    input: 'diff-builder/cli.ts',
    output: [
        {
            file: 'dist/diff-builder',
            name: 'diff-builder',
            format: 'cjs',
            sourcemap: false,
        },
    ],
    external: commonExternal,
    plugins: commonPlugins.concat([preserveShebangs()]),
    watch: {
        include: 'diff-builder/**',
    },
});

// output as API
const apiConfig = defineConfig({
    input: 'diff-builder/api.ts',
    output: [
        {
            file: 'dist/api/cjs/diff-builder.js',
            format: 'cjs',
            sourcemap: false,
        },
        {
            file: 'dist/api/es/diff-builder.js',
            format: 'esm',
            sourcemap: false,
        },
    ],
    external: commonExternal,
    plugins: commonPlugins,
    watch: {
        include: 'diff-builder/**',
    },
});

export default [
    cliConfig,
    apiConfig,
];