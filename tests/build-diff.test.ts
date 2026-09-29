import fs from 'fs';
import os from 'os';
import path from 'path';

import { buildDiff, type BuildDiffParams } from '../src/diff-builder/build';
import { applyRcsPatch } from '../src/diff-updater/update';
import { BUILD_DIFF_NEW_FILTER, BUILD_DIFF_OLD_FILTER } from './stubs/build-diff';

jest.mock('../src/diff-updater/update', () => ({
    applyRcsPatch: jest.fn(),
}));

const mockedApplyRcsPatch = jest.mocked(applyRcsPatch);

describe('check buildDiff validation', () => {
    let workDir: string;
    let oldFilterPath: string;
    let newFilterPath: string;
    let patchesPath: string;
    let logSpy: jest.SpyInstance;

    const buildDiffParams = (): BuildDiffParams => ({
        oldFilterPath,
        newFilterPath,
        patchesPath,
        name: 'test',
        time: 60,
        verbose: true,
    });

    beforeEach(async () => {
        workDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'diff-builder-'));
        oldFilterPath = path.join(workDir, 'old_filter.txt');
        newFilterPath = path.join(workDir, 'filter.txt');
        patchesPath = path.join(workDir, 'patches');

        await fs.promises.writeFile(oldFilterPath, BUILD_DIFF_OLD_FILTER);
        await fs.promises.writeFile(newFilterPath, BUILD_DIFF_NEW_FILTER);

        logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(async () => {
        logSpy.mockRestore();
        mockedApplyRcsPatch.mockReset();
        await fs.promises.rm(workDir, { recursive: true, force: true });
    });

    it('throws and keeps the apply error as the cause when the patch cannot be applied', async () => {
        const applyError = new Error('Maximum call stack size exceeded');
        mockedApplyRcsPatch.mockImplementation(() => {
            throw applyError;
        });

        await expect(buildDiff(buildDiffParams())).rejects.toMatchObject({
            message: `Validating generated patch failed: ${applyError.message}`,
            cause: applyError,
        });
    });

    it('throws when the patched old filter differs from the new filter', async () => {
        mockedApplyRcsPatch.mockReturnValue('||different.example^\n');

        await expect(buildDiff(buildDiffParams())).rejects.toThrow(
            'Validating generated patch failed: old file with applied patch is not equal to new file.',
        );
    });

    it('keeps the underlying error in the log', async () => {
        mockedApplyRcsPatch.mockImplementation(() => {
            throw new Error('Maximum call stack size exceeded');
        });

        await expect(buildDiff(buildDiffParams())).rejects.toThrow();

        expect(logSpy).toHaveBeenCalledWith(
            'Failed to apply patch to the old file: Maximum call stack size exceeded',
        );
    });

    it('does not modify files when validation fails', async () => {
        mockedApplyRcsPatch.mockReturnValue('||different.example^\n');

        await expect(buildDiff(buildDiffParams())).rejects.toThrow();

        const newFilterContent = await fs.promises.readFile(newFilterPath, { encoding: 'utf-8' });
        expect(newFilterContent).toStrictEqual(BUILD_DIFF_NEW_FILTER);

        const patchFiles = await fs.promises.readdir(patchesPath);
        expect(patchFiles).toStrictEqual([]);
    });

    it('resolves and writes files when the patch is valid', async () => {
        type UpdateModule = typeof import('../src/diff-updater/update');

        const { applyRcsPatch: actualApplyRcsPatch } = jest.requireActual<UpdateModule>(
            '../src/diff-updater/update',
        );
        mockedApplyRcsPatch.mockImplementation(actualApplyRcsPatch);

        await expect(buildDiff(buildDiffParams())).resolves.toBeUndefined();

        const newFilterContent = await fs.promises.readFile(newFilterPath, { encoding: 'utf-8' });
        expect(newFilterContent).not.toStrictEqual(BUILD_DIFF_NEW_FILTER);
        expect(newFilterContent).toContain('||example.org^');
        expect(newFilterContent).not.toContain('test-h-1000-60.patch');

        const patchFiles = await fs.promises.readdir(patchesPath);
        expect(patchFiles).toHaveLength(2);

        const oldVersionPatch = await fs.promises.readFile(
            path.join(patchesPath, 'test-h-1000-60.patch'),
            { encoding: 'utf-8' },
        );
        expect(oldVersionPatch.length).toBeGreaterThan(0);

        const newVersionPatchNames = patchFiles.filter((file) => file !== 'test-h-1000-60.patch');
        expect(newVersionPatchNames).toHaveLength(1);
        const newVersionPatchStat = await fs.promises.stat(
            path.join(patchesPath, newVersionPatchNames[0]),
        );
        expect(newVersionPatchStat.size).toBe(0);
    });
});
