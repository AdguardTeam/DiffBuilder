import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import cleanup from 'rollup-plugin-cleanup';
import { preserveShebangs } from 'rollup-plugin-preserve-shebangs';

const commonPlugins = [
    // Allow json resolution
    json(),

    // Compile TypeScript files
    typescript(),

    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs({ sourceMap: false }),

    cleanup({ comments: ['srcmaps'] }),
];

// CLI for diff-builder
const cliConfig = defineConfig({
    input: 'src/bin/cli.ts',
    output: [
        {
            file: 'dist/bin/diff-builder',
            name: 'diff-builder',
            format: 'cjs',
            sourcemap: false,
        },
    ],
    external: [
        'fs',
        'path',
        'commander',
    ],
    plugins: commonPlugins.concat([
        // Allow node_modules resolution, so you can use 'external' to control
        // which external modules to include in the bundle
        // https://github.com/rollup/rollup-plugin-node-resolve#usage
        resolve({ preferBuiltins: false }),
        preserveShebangs(),
    ]),
    watch: {
        include: 'src/**',
    },
});

// diff-builder API
const builderApiConfig = defineConfig({
    input: 'src/diff-builder/index.ts',
    output: [
        {
            file: 'dist/api/builder/cjs/index.js',
            format: 'cjs',
            sourcemap: false,
        },
        {
            file: 'dist/api/builder/es/index.js',
            format: 'esm',
            sourcemap: false,
        },
    ],
    external: [
        'fs',
        'path',
        'crypto',
    ],
    plugins: commonPlugins.concat([
        // Allow node_modules resolution, so you can use 'external' to control
        // which external modules to include in the bundle
        // https://github.com/rollup/rollup-plugin-node-resolve#usage
        resolve({ preferBuiltins: false }),
    ]),
    watch: {
        include: 'src/**',
    },
    treeshake: {
        moduleSideEffects: false,
    },
});

// diff-updater API
const updaterApiConfig = defineConfig({
    input: 'src/diff-updater/index.ts',
    output: [
        {
            file: 'dist/api/updater/cjs/index.js',
            format: 'cjs',
            sourcemap: false,
        },
        {
            file: 'dist/api/updater/es/index.js',
            format: 'esm',
            sourcemap: false,
        },
    ],
    plugins: commonPlugins.concat([
        resolve({ browser: true }),
    ]),
    watch: {
        include: 'src/**',
    },
    treeshake: {
        moduleSideEffects: false,
    },
});

export default [
    cliConfig,
    builderApiConfig,
    updaterApiConfig,
];
