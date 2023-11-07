import type { Config } from 'jest';

const config: Config = {
    transform: {
        '.+\\.(js|ts)$': '@swc/jest',
    },
    testEnvironment: 'node',
    testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
    moduleFileExtensions: ['js', 'ts'],
};

export default config;
