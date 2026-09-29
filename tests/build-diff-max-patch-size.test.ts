import path from 'path';
import fs from 'fs';
import os from 'os';

import { DIFF_PATH_TAG } from '../src/common/constants';
import { splitByLines } from '../src/common/split-by-lines';
import { buildDiff } from '../src/diff-builder/build';
import { parseTag } from '../src/diff-builder/tags';

/**
 * Reads the value of the `Diff-Path` tag from a filter file.
 *
 * @param filterPath Absolute path to the filter file.
 *
 * @returns The `Diff-Path` tag value or `null` if the tag is absent.
 */
const readDiffPathTag = async (filterPath: string): Promise<string | null> => {
    const content = await fs.promises.readFile(filterPath, 'utf-8');

    return parseTag(DIFF_PATH_TAG, splitByLines(content));
};

describe('buildDiff', () => {
    let tempDir: string;
    let oldFilterPath: string;
    let newFilterPath: string;
    let patchesPath: string;

    beforeEach(async () => {
        tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'diff-builder-'));
        oldFilterPath = path.join(tempDir, 'old-filter.txt');
        newFilterPath = path.join(tempDir, 'new-filter.txt');
        patchesPath = path.join(tempDir, 'patches');
        await fs.promises.mkdir(patchesPath);
    });

    afterEach(async () => {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
    });

    it('deletes stale empty patches when the old filter has no Diff-Path', async () => {
        const oldFilter = '! Title: Test filter\n||example.org^\n';
        const newFilter = '! Title: Test filter\n||example.com^\n';
        await fs.promises.writeFile(oldFilterPath, oldFilter);
        await fs.promises.writeFile(newFilterPath, newFilter);

        // Emulate empty placeholders left by previous failed builds.
        await fs.promises.writeFile(path.join(patchesPath, 'filter-1-60.patch'), '');
        await fs.promises.writeFile(path.join(patchesPath, 'filter-2-60.patch'), '');

        await buildDiff({
            oldFilterPath,
            newFilterPath,
            patchesPath,
            name: 'filter',
            time: 60,
        });

        const diffPath = await readDiffPathTag(newFilterPath);
        expect(diffPath).not.toBeNull();

        const patchFiles = await fs.promises.readdir(patchesPath);
        expect(patchFiles).toHaveLength(1);

        const { size } = await fs.promises.stat(path.join(patchesPath, patchFiles[0]));
        expect(size).toBe(0);
    });

    it('does not create a patch larger than maxPatchSize and deletes empty patches', async () => {
        const oldFilter = '! Title: Test filter\n! Diff-Path: patches/filter-old-60.patch\n||example.org^\n';
        const newFilter = '! Title: Test filter\n||example.com^\n';
        await fs.promises.writeFile(oldFilterPath, oldFilter);
        await fs.promises.writeFile(newFilterPath, newFilter);

        // Emulate a stale empty placeholder left by a previous failed build.
        await fs.promises.writeFile(path.join(patchesPath, 'filter-old-60.patch'), '');

        await buildDiff({
            oldFilterPath,
            newFilterPath,
            patchesPath,
            name: 'filter',
            time: 60,
            maxPatchSize: 1,
        });

        // The new filter is published as is, without the `Diff-Path` tag.
        const updatedNewFilter = await fs.promises.readFile(newFilterPath, 'utf-8');
        expect(updatedNewFilter).toStrictEqual(newFilter);

        const patchFiles = await fs.promises.readdir(patchesPath);
        expect(patchFiles).toEqual([]);
    });

    it('recovers from an oversized patch and resumes diff updates on later builds', async () => {
        const filterV1 = '! Title: Test filter\n! Diff-Path: patches/filter-old-60.patch\n||example.org^\n';
        const filterV2 = '! Title: Test filter\n||example.com^\n';
        const filterV3 = '! Title: Test filter\n||example.net^\n';
        const filterV4 = '! Title: Test filter\n||example.io^\n';

        await fs.promises.writeFile(oldFilterPath, filterV1);
        await fs.promises.writeFile(newFilterPath, filterV2);
        await fs.promises.writeFile(path.join(patchesPath, 'filter-old-60.patch'), '');

        // The first build skips the patch because it exceeds maxPatchSize.
        await buildDiff({
            oldFilterPath,
            newFilterPath,
            patchesPath,
            name: 'filter1',
            time: 60,
            maxPatchSize: 1,
        });

        // The second build bootstraps diff updates for the filter that has no
        // Diff-Path: it adds the tag and creates a single empty placeholder.
        const oldFilterV2Path = path.join(tempDir, 'old-filter-v2.txt');
        await fs.promises.copyFile(newFilterPath, oldFilterV2Path);
        await fs.promises.writeFile(newFilterPath, filterV3);

        await buildDiff({
            oldFilterPath: oldFilterV2Path,
            newFilterPath,
            patchesPath,
            name: 'filter2',
            time: 60,
        });

        const diffPath = await readDiffPathTag(newFilterPath);
        expect(diffPath).not.toBeNull();

        let patchFiles = await fs.promises.readdir(patchesPath);
        expect(patchFiles).toHaveLength(1);

        const placeholderStats = await fs.promises.stat(path.join(patchesPath, patchFiles[0]));
        expect(placeholderStats.size).toBe(0);

        // The third build fills the placeholder with the patch for the old
        // version and creates exactly one new empty placeholder.
        const oldFilterV3Path = path.join(tempDir, 'old-filter-v3.txt');
        await fs.promises.copyFile(newFilterPath, oldFilterV3Path);
        await fs.promises.writeFile(newFilterPath, filterV4);

        await buildDiff({
            oldFilterPath: oldFilterV3Path,
            newFilterPath,
            patchesPath,
            name: 'filter3',
            time: 60,
        });

        patchFiles = await fs.promises.readdir(patchesPath);
        expect(patchFiles).toHaveLength(2);

        const patchSizes = await Promise.all(patchFiles.map(async (file) => {
            const fileStats = await fs.promises.stat(path.join(patchesPath, file));

            return fileStats.size;
        }));
        expect(patchSizes.filter((size) => size === 0)).toHaveLength(1);
        expect(patchSizes.filter((size) => size > 0)).toHaveLength(1);
    });

    it('throws when maxPatchSize is not a positive finite number', async () => {
        const oldFilter = '! Title: Test filter\n||example.org^\n';
        const newFilter = '! Title: Test filter\n||example.com^\n';
        await fs.promises.writeFile(oldFilterPath, oldFilter);
        await fs.promises.writeFile(newFilterPath, newFilter);

        const invalidMaxPatchSizes = [0, -1, Number.NaN, Number.POSITIVE_INFINITY];

        await Promise.all(invalidMaxPatchSizes.map(async (maxPatchSize) => {
            await expect(buildDiff({
                oldFilterPath,
                newFilterPath,
                patchesPath,
                name: 'filter',
                time: 60,
                maxPatchSize,
            })).rejects.toThrow('Maximum patch size should be a positive number.');
        }));
    });
});
