import path from 'path';
import fs from 'fs';
import { parseDiffDirective } from '../src/common/diff-directive';
import { applyPatch, applyRcsPatch } from '../src/diff-updater/update';
import {
    FILE_1,
    FILE_1_2_PATCH,
    FILE_2,
    FILE_2_DIFF_DIRECTIVE,
    FILE_3,
    FILE_3_4_PATCH,
    FILE_4,
    FILE_4_DIFF_DIRECTIVE,
    FILE_5,
    FILE_5_6_PATCH,
    FILE_6,
    FILE_6_DIFF_DIRECTIVE,
    FILE_7,
    FILE_7_8_PATCH,
    FILE_8,
    FILE_8_DIFF_DIRECTIVE,
} from './stubs/random-files';
import {
    FILTER_1_V_1_0_0,
    FILTER_1_V_1_0_1,
    FILTER_1_V_1_0_1_DIFF_DIRECTIVE,
    PATCH_1_1_0_0,
} from './stubs/simple';
import {
    FILTER_2_V_1_0_0,
    FILTER_2_V_1_0_1,
    FILTER_2_V_1_0_1_DIFF_DIRECTIVE,
    PATCH_2_1_0_0,
} from './stubs/validation';
import {
    FILTER_3_V_1_0_0,
    FILTER_3_V_1_0_1,
    FILTER_3_V_1_0_1_DIFF_DIRECTIVE,
    PATCH_3_1_0_0,
} from './stubs/name';
import { server } from './server';
import { splitByLines } from '../src/common/split-by-lines';

describe('check diff-updater', () => {
    describe('applyRcsPatch', () => {
        const cases = [
            [FILTER_1_V_1_0_0, FILTER_1_V_1_0_1, PATCH_1_1_0_0, FILTER_1_V_1_0_1_DIFF_DIRECTIVE],
            [FILTER_2_V_1_0_0, FILTER_2_V_1_0_1, PATCH_2_1_0_0, FILTER_2_V_1_0_1_DIFF_DIRECTIVE],
            [FILTER_3_V_1_0_0, FILTER_3_V_1_0_1, PATCH_3_1_0_0, FILTER_3_V_1_0_1_DIFF_DIRECTIVE],
            [FILE_1, FILE_2, FILE_1_2_PATCH, FILE_2_DIFF_DIRECTIVE],
            [FILE_3, FILE_4, FILE_3_4_PATCH, FILE_4_DIFF_DIRECTIVE],
            [FILE_5, FILE_6, FILE_5_6_PATCH, FILE_6_DIFF_DIRECTIVE],
            [FILE_7, FILE_8, FILE_7_8_PATCH, FILE_8_DIFF_DIRECTIVE],
        ];

        it.each(cases)('apply rcs patch: "%s"', (
            oldFilter,
            newFilter,
            patch,
            diffDirective,
        ) => {
            const filterLines = splitByLines(oldFilter);
            const patchLines = splitByLines(patch);

            let updatedFilter = applyRcsPatch(
                filterLines,
                patchLines,
            );

            expect(updatedFilter).toStrictEqual(newFilter);

            const parsedDiffDirective = parseDiffDirective(diffDirective);
            updatedFilter = applyRcsPatch(
                filterLines,
                patchLines,
                parsedDiffDirective ? parsedDiffDirective.checksum : undefined,
            );

            expect(updatedFilter).toStrictEqual(newFilter);
        });
    });

    describe('applyPatch', () => {
        const basePath = 'http://localhost:3000';

        beforeAll(async () => {
            await server.start();
        });

        afterAll(async () => {
            await server.stop();
        });

        const cases = [
            ['applies one simple patch', './fixtures/1/filter_v1.0.0.txt', './fixtures/1/filter_v1.0.1.txt'],
            ['applies patches in a row', './fixtures/2/filter_v1.0.0.txt', './fixtures/2/filter_v1.0.2.txt'],
            ['applies patches with checksum', './fixtures/3/filter_v1.0.0.txt', './fixtures/3/filter_v1.0.2.txt'],
        ];

        it.each(cases)('case: "%s"', async (
            testName,
            oldestFilterPathName,
            newestFilterPathName,
        ) => {
            const oldestFilterUrl = new URL(oldestFilterPathName, basePath).toString();
            const oldestFilter = await fs.promises.readFile(
                path.resolve(__dirname, oldestFilterPathName),
                'utf-8',
            );

            const latestFilter = await fs.promises.readFile(
                path.resolve(__dirname, newestFilterPathName),
                'utf-8',
            );

            const updatedFilter = await applyPatch(oldestFilterUrl, oldestFilter);
            expect(updatedFilter).toStrictEqual(latestFilter);
        });

        it('not applies not expired patches', async () => {
            const originalDateNow = Date.now;

            // To test that all patches not expires yet
            Date.now = jest.fn(() => 1700038800000);

            const oldestFilterPathName = './fixtures/1/filter_v1.0.0.txt';
            const oldestFilterUrl = new URL(oldestFilterPathName, basePath).toString();
            const oldestFilter = await fs.promises.readFile(
                path.resolve(__dirname, oldestFilterPathName),
                'utf-8',
            );

            const updatedFilter = await applyPatch(oldestFilterUrl, oldestFilter);
            expect(updatedFilter).toStrictEqual(oldestFilter);

            Date.now = originalDateNow;
        });

        it('throws error when checksums are not equal', async () => {
            const oldestFilterPathName = './fixtures/4/filter_v1.0.0.txt';
            const oldestFilterUrl = new URL(oldestFilterPathName, basePath).toString();
            const oldestFilter = await fs.promises.readFile(
                path.resolve(__dirname, oldestFilterPathName),
                'utf-8',
            );

            await expect(
                // eslint-disable-next-line @typescript-eslint/return-await
                async () => await applyPatch(oldestFilterUrl, oldestFilter),
            ).rejects.toThrowError('Checksums are not equal.');
        });
    });
});
