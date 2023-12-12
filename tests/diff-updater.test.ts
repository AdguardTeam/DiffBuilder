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

const originalDateNow = Date.now;

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
            let updatedFilter = applyRcsPatch(
                oldFilter.split(/\r?\n/),
                patch.split(/\r?\n/),
                oldFilter.endsWith('\r\n') ? '\r\n' : '\n',
            );

            expect(updatedFilter).toBe(newFilter);

            const parsedDiffDirective = parseDiffDirective(diffDirective);
            updatedFilter = applyRcsPatch(
                oldFilter.split(/\r?\n/),
                patch.split(/\r?\n/),
                oldFilter.endsWith('\r\n') ? '\r\n' : '\n',
                parsedDiffDirective ? parsedDiffDirective.checksum : undefined,
            );

            expect(updatedFilter).toBe(newFilter);
        });
    });

    describe('applyPatch', () => {
        beforeAll(async () => {
            await server.start();

            Date.now = originalDateNow;
        });

        afterAll(async () => {
            await server.stop();
        });

        it('applies simple patches', async () => {
            // To test that all patches expires
            Date.now = jest.fn(() => 1700038800000);

            const basePath = 'http://localhost:3000';

            const oldestFilterPathName = './fixtures/1/filter_v1.0.0.txt';
            const oldestFilterUrl = new URL(oldestFilterPathName, basePath).toString();
            const oldestFilter = await fs.promises.readFile(
                path.resolve(__dirname, oldestFilterPathName),
                'utf-8',
            );

            const latestFilter = await fs.promises.readFile(
                path.resolve(__dirname, './fixtures/1/filter_v1.0.2.txt'),
                'utf-8',
            );

            const updatedFilter = await applyPatch(oldestFilterUrl, oldestFilter);
            expect(updatedFilter).toStrictEqual(latestFilter.trim());
        });

        it('applies patches with checksum', async () => {
            // To test that all patches expires
            Date.now = jest.fn(() => 1700038800000);

            const basePath = 'http://localhost:3000';

            const oldestFilterPathName = './fixtures/2/filter_v1.0.0.txt';
            const oldestFilterUrl = new URL(oldestFilterPathName, basePath).toString();
            const oldestFilter = await fs.promises.readFile(
                path.resolve(__dirname, oldestFilterPathName),
                'utf-8',
            );

            const latestFilter = await fs.promises.readFile(
                path.resolve(__dirname, './fixtures/2/filter_v1.0.2.txt'),
                'utf-8',
            );

            const updatedFilter = await applyPatch(oldestFilterUrl, oldestFilter);
            expect(updatedFilter).toStrictEqual(latestFilter.trim());
        });

        // TODO: Test for expires
        // TODO: Test for invalid checksum
        // TODO: Test for only 1 patch
        // TODO: Test for 404, 204, 200 statuses
    });
});
