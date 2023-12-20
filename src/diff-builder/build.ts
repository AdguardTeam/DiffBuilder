import path from 'path';
import fs from 'fs';

import * as Diff from 'diff';

import { parseTag } from '../common/parse-tag';
import { CHECKSUM_TAG, DIFF_PATH_TAG } from '../common/constants';
import { TypesOfChanges } from '../common/types-of-change';
import { createDiffDirective } from '../common/diff-directive';
import { calculateChecksumMD5, calculateChecksumSHA1 } from '../common/calculate-checksum';
import { Resolution, createPatchName } from '../common/patch-name';
import { splitByLines } from '../common/split-by-lines';
import { createLogger } from '../common/create-logger';
import { createTag, findAndUpdateTag, removeTag } from './tags';

const DEFAULT_PATCH_TTL_SECONDS = 60 * 60 * 24 * 7;

const NEW_LINE_INFO = '\\ No newline at end of file';

export const PATCH_EXTENSION = '.patch';

/**
 * Parameters for building a diff patch between old and new filters.
 */
export interface BuildDiffParams {
    /**
     * The relative path to the old filter.
     */
    oldFilterPath: string;

    /**
     * The relative path to the new filter.
     */
    newFilterPath: string;

    /**
     * The relative path to the directory where the patch should be saved.
     * The patch filename will be `<path_to_patches>/$PATCH_VERSION.patch`,
     * where `$PATCH_VERSION` is the value of `Version` from `<old_filter>`.
     */
    patchesPath: string;

    /**
     * Name of the patch file, an arbitrary string to identify the patch.
     * Must be a string of length 1-64 with no spaces or other special characters.
     */
    name: string;

    /**
     * Expiration time for the diff update (the unit depends on `resolution`).
     */
    time: number;

    /**
     * An optional flag, indicating whether it should calculate
     * the SHA sum for the filter and add it to the `diff` directive with the filter
     * name and the number of changed lines.
     */
    checksum?: boolean;

    /**
     * An optional flag, specifying the resolution for
     * both `expirationPeriod` and `epochTimestamp` (timestamp when the patch was
     * generated). It can be either `h` (hours), `m` (minutes), or `s` (seconds).
     * If not specified, it is assumed to be `h`.
     */
    resolution?: Resolution;

    /**
     * An optional parameter, the time to live for the patch
     * in *seconds*. By default, it will be `604800` (7 days). The utility will
     * scan `<path_to_patches>` and delete patches whose `mtime` has expired.
     */
    deleteOlderThanSec?: number;

    /**
     * Verbose mode.
     */
    verbose?: boolean;
}

/**
 * Detects type of diff changes: add or delete.
 *
 * @param line Line of string to parse.
 *
 * @returns String type: 'Add' or 'Delete' or null if type cannot be parsed.
 */
export const detectTypeOfChanges = (line: string): TypesOfChanges | null => {
    if (line.startsWith('+')) {
        return TypesOfChanges.Add;
    }

    if (line.startsWith('-')) {
        return TypesOfChanges.Delete;
    }

    return null;
};

/**
 * Creates patch in [RCS format](https://www.gnu.org/software/diffutils/manual/diffutils.html#RCS).
 *
 * @param oldFile Old file.
 * @param newFile New file.
 *
 * @returns Difference between old and new files in RCS format.
 */
export const createPatch = (oldFile: string, newFile: string): string => {
    const { hunks } = Diff.structuredPatch(
        'oldFile',
        'newFile',
        oldFile,
        newFile,
        '',
        '',
        {
            context: 0,
            ignoreCase: false,
        },
    );

    const outDiff: string[] = [];

    let stringsToAdd: string[] = [];
    let nStringsToDelete = 0;

    const collectParsedDiffBlock = (
        curIndex: number,
        deleted: number,
        added: string[],
    ): string[] => {
        if (deleted > 0) {
            const deleteFromPosition = curIndex;
            const rcsLines = [`d${deleteFromPosition} ${deleted}`];

            return rcsLines;
        }

        if (added.length > 0) {
            const addFromPosition = curIndex - 1;
            const rcsLines = [
                `a${addFromPosition} ${added.length}`,
                ...added,
            ];

            return rcsLines;
        }

        return [];
    };

    hunks.forEach((hunk, hunkIdx) => {
        const { oldStart, lines } = hunk;

        let fileIndexScanned = oldStart;

        // Library will print some debug info so we need to skip this line.
        const filteredLines = lines.filter((l) => l !== NEW_LINE_INFO);

        for (let index = 0; index < filteredLines.length; index += 1) {
            const line = filteredLines[index];

            // Detect type of diff operation
            const typeOfChange = detectTypeOfChanges(line);

            // Library will print some debug info so we need to skip this line.
            if (typeOfChange === null) {
                throw new Error(`Cannot parse line: ${line}`);
            }

            if (typeOfChange === TypesOfChanges.Delete) {
                // In RCS format we don't need content of deleted string.
                nStringsToDelete += 1;
            }
            if (typeOfChange === TypesOfChanges.Add) {
                // Slice "+" from the start of string.
                stringsToAdd.push(line.slice(1));
            }

            // Check type of next line for possible change diff type from 'add'
            // to 'delete' or from 'delete' to 'add'.
            const nextLineTypeOfChange = index + 1 < filteredLines.length
                ? detectTypeOfChanges(filteredLines[index + 1])
                : null;
            // If type will change - save current block
            const typeWillChangeOnNextLine = nextLineTypeOfChange && typeOfChange !== nextLineTypeOfChange;
            // Or if current line is the last - we need to save collected info.
            const isLastLine = index === filteredLines.length - 1;
            if (typeWillChangeOnNextLine || isLastLine) {
                const diffRCSLines = collectParsedDiffBlock(
                    fileIndexScanned,
                    nStringsToDelete,
                    stringsToAdd,
                );
                outDiff.push(...diffRCSLines);

                // Drop counters
                nStringsToDelete = 0;
                stringsToAdd = [];

                // Move scanned index
                fileIndexScanned += index + 1;
            }
        }

        // Check if we need to insert new line to the patch or not
        if ((lines.filter((l) => l === NEW_LINE_INFO).length > 0 && lines[lines.length - 1] !== NEW_LINE_INFO)
            || (lines.filter((l) => l === NEW_LINE_INFO).length === 0 && hunkIdx === hunks.length - 1)) {
            outDiff[outDiff.length - 1] = outDiff[outDiff.length - 1].concat('\n');
        }
    });

    return outDiff.join('\n');
};

/**
 * Scans `pathToPatches` for files with the "*.patch" pattern and deletes those
 * whose `mtime` has expired.
 *
 * @param pathToPatches Directory for scan.
 * @param deleteOlderThanSeconds The time to live for the patch in *seconds*.
 *
 * @returns Returns number of deleted patches.
 */
const deleteOutdatedPatches = async (
    pathToPatches: string,
    deleteOlderThanSeconds: number,
): Promise<number> => {
    const files = await fs.promises.readdir(pathToPatches);
    const tasksToDeleteFiles: Promise<void>[] = [];
    for (const file of files) {
        if (!file.endsWith(PATCH_EXTENSION)) {
            continue;
        }

        const filePath = path.resolve(pathToPatches, file);

        // eslint-disable-next-line no-await-in-loop
        const fileStat = await fs.promises.stat(filePath);

        const deleteOlderThanMs = deleteOlderThanSeconds * 1000;
        const deleteOlderThanDate = new Date(new Date().getTime() - deleteOlderThanMs);

        if (fileStat.mtime.getTime() < deleteOlderThanDate.getTime()) {
            // eslint-disable-next-line no-await-in-loop
            tasksToDeleteFiles.push(fs.promises.rm(filePath));
        }
    }

    const deleted = await Promise.all(tasksToDeleteFiles);

    return deleted.length;
};

/**
 * Updates the 'Diff-Path' tag value and recalculates the checksum, updating it
 * in the 'Checksum' tag of the new filter. This process ensures that changes
 * in these tags are reflected in the patch, allowing them to be applied
 * to the old filter. If the old and new filters are identical except for
 * these tags, the patch will contain only changes related
 * to 'Diff-Path' and 'Checksum'.
 *
 * To verify the patch's significance, it's essential to check that it contains
 * more than just these tag updates. The checksum, typically on the first line,
 * is checked in the first three lines of the patch in RCS format. The next
 * three lines are examined for changes to the 'Diff-Path' tag, which can appear
 * anywhere in the new filter.
 *
 * @param patch The patch array to be evaluated.
 * @returns Returns `true` if the patch contains only tag changes or is
 * otherwise empty, indicating no substantial differences between the filters.
 * Returns `false` if there are other changes.
 */
export const checkIfPatchIsEmpty = (patch: string): boolean => {
    const lines = splitByLines(patch);

    if (lines.length === 4
        && lines[0].startsWith('d1 2')
        && lines[1].startsWith('a2 2')
        && lines[2].startsWith(`! ${CHECKSUM_TAG}`)
        && lines[3].startsWith(`! ${DIFF_PATH_TAG}`)
    ) {
        return true;
    }

    if (lines.length === 6
        && lines[0].startsWith('d1 1')
        && lines[1].startsWith('a1 1')
        && lines[2].startsWith(`! ${CHECKSUM_TAG}`)
        && lines[3].startsWith('d')
        && lines[4].startsWith('a')
        && lines[5].startsWith(`! ${DIFF_PATH_TAG}`)
    ) {
        return true;
    }

    return false;
};

/**
 * Updates the 'Diff-Path' tag in a given filter array and recalculates the checksum.
 * The function first updates the 'Diff-Path' tag with the provided value, then removes
 * the existing checksum tag (if any), as the filter content has been altered.
 * It then calculates a new checksum for the updated filter and adds
 * this checksum tag to the filter. This process ensures that the filter's
 * metadata (Diff-Path and Checksum tags) accurately reflects its current content.
 *
 * @param filterToUpdate An array of strings representing the filter lines to be updated.
 * @param diffPathTagValue The new value to be set for the 'Diff-Path' tag.
 *
 * @returns A new array of filter lines with the updated 'Diff-Path' tag and recalculated checksum.
 */
export const updateDiffPathInNewFilter = (
    filterToUpdate: string[],
    diffPathTagValue: string,
): string[] => {
    // Make a copy
    let updatedFilter = filterToUpdate.slice();

    updatedFilter = findAndUpdateTag(
        DIFF_PATH_TAG,
        diffPathTagValue,
        updatedFilter,
    );

    // Remove first found checksum tag, because we changed filter's content
    // via adding Diff-Path tag, so we need to recalculate checksum.
    updatedFilter = removeTag(CHECKSUM_TAG, updatedFilter);

    // Calculate checksum for new filter and insert it in the filter
    // to the first line.
    const updatedChecksum = calculateChecksumMD5(updatedFilter.join(''));
    const checksumTag = createTag(CHECKSUM_TAG, updatedChecksum);
    updatedFilter.unshift(checksumTag);

    return updatedFilter;
};

/**
 * First verifies the version tags in the old and new filters, ensuring they are
 * present and in the correct order. Then calculates the difference between
 * the old and new filters in [RCS format](https://www.gnu.org/software/diffutils/manual/diffutils.html#RCS).
 * Optionally, calculates a diff directive with the name, checksum of new filter,
 * and line count, extracting the name from the `Diff-Name` tag in the old filter.
 * The resulting diff is saved to a patch file with the version number in the
 * specified path. Also updates the `Diff-Path` tag in the new filter.
 * Additionally, an empty patch file for the newer version is created.
 * Finally, scans the patch directory and deletes patches with the ".patch"
 * extension that have an mtime older than the specified threshold.
 *
 * TODO: Add tests for files operations.
 *
 * @param params - Parameters for building the diff patch.
 */
export const buildDiff = async (params: BuildDiffParams): Promise<void> => {
    const {
        oldFilterPath,
        newFilterPath,
        patchesPath,
        name,
        time,
        resolution = Resolution.Hours,
        checksum = false,
        deleteOlderThanSec = DEFAULT_PATCH_TTL_SECONDS,
        verbose = false,
    } = params;

    const log = createLogger(verbose);

    // Paths
    const prevListPath = path.resolve(process.cwd(), oldFilterPath);
    const newListPath = path.resolve(process.cwd(), newFilterPath);
    const pathToPatches = path.resolve(process.cwd(), patchesPath);

    // Filters' content
    const oldFile = await fs.promises.readFile(prevListPath, { encoding: 'utf-8' });
    let newFile = await fs.promises.readFile(newListPath, { encoding: 'utf-8' });

    // Splitted filters' content
    const oldFileSplitted = splitByLines(oldFile);
    let newFileSplitted = splitByLines(newFile);

    const oldFileDiffName = parseTag(DIFF_PATH_TAG, oldFileSplitted);

    // Create folder for patches if it doesn't exists.
    if (!fs.existsSync(pathToPatches)) {
        await fs.promises.mkdir(pathToPatches, { recursive: true });
        log(`Folder for patches does not exists, created at '${pathToPatches}'.`);
    }

    // Scan patches folder and delete outdated patches.
    const deleted = await deleteOutdatedPatches(
        pathToPatches,
        deleteOlderThanSec,
    );

    log(`Deleted outdated patches: ${deleted}`);

    // If files are the same and old filter already has diff-path - there are nothing to do.
    // Otherwise, create empty patch for future version and exit.
    if (calculateChecksumSHA1(oldFile) === calculateChecksumSHA1(newFile) && oldFileDiffName) {
        log('Files are the same. Nothing to do.');
        return;
    }

    // Generate name for new patch
    const newFileDiffName = createPatchName({ name, resolution, time });

    if (oldFileDiffName === newFileDiffName) {
        // eslint-disable-next-line max-len
        throw new Error(`Old patch name "${oldFileDiffName}" and new patch name "${newFileDiffName}" are the same. Change the unit of measure to a smaller one or wait.`);
    }

    // Create empty patch for future version if it doesn't exists.
    const emptyPatchForNewVersion = path.join(pathToPatches, newFileDiffName);
    if (!fs.existsSync(emptyPatchForNewVersion)) {
        await fs.promises.writeFile(emptyPatchForNewVersion, '');
        log(`Created patch for new filter at ${emptyPatchForNewVersion}.`);
    }

    // Note: Update `Diff-Path` and 'Checksum' before calculating the diff
    // to ensure that changing `Diff-Path` and 'Checksum' will be correctly
    // included in the resulting diff patch.
    const pathToPatchesRelativeToNewFilter = path.relative(
        path.dirname(newFilterPath),
        pathToPatches,
    );
    const newFilterDiffPathTagValue = path.join(pathToPatchesRelativeToNewFilter, newFileDiffName);
    newFileSplitted = updateDiffPathInNewFilter(
        newFileSplitted,
        newFilterDiffPathTagValue,
    );
    newFile = newFileSplitted.join('');

    // Because we already created empty patch for new version, we also need to
    // update `Diff-Path` (which contains path to created empty patch) and
    // `Checksum` tags in the new filter.
    await fs.promises.writeFile(
        newListPath,
        newFile,
    );

    // We cannot save diff, if diff in old file doesn't exists.
    if (!oldFileDiffName) {
        log('Not found "Diff-Path" in the old filter. Patch for old file can not be created.');
        return;
    }

    // Calculate diff
    let patch = createPatch(oldFile, newFile);

    // If patch is empty - don't write it to file.
    if (checkIfPatchIsEmpty(patch)) {
        log('No changes detected between old and new files. Patch would not be created.');
        return;
    }

    // Add checksum to patch if requested
    if (checksum) {
        const diffDirective = createDiffDirective(oldFileSplitted, newFile, patch);
        patch = diffDirective.concat('\n', patch);
    }

    // Diff-Path contains path relative to the filter path, so we need
    // to resolve path.
    const oldFilePatch = path.resolve(
        path.dirname(prevListPath),
        oldFileDiffName,
    );
    // Save diff to patch file.
    await fs.promises.writeFile(
        oldFilePatch,
        patch,
    );

    log(`Wrote patch to: ${oldFilePatch}`);
};
