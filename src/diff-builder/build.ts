import path from 'path';
import fs from 'fs';

import * as Diff from 'diff';

import { parseTag } from '../common/parse-tag';
import { DIFF_PATH_TAG } from '../common/constants';
import { TypesOfChanges } from '../common/types-of-change';
import { createDiffDirective } from '../common/diff-directive';

const DEFAULT_PATCH_TTL_SECONDS = 60 * 60 * 24 * 7;

export enum Resolution {
    Hours = 'h',
    Minutes = 'm',
    Seconds = 's',
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

    hunks.forEach((hunk) => {
        const { oldStart, lines } = hunk;

        let fileIndexScanned = oldStart;

        // Library will print some debug info so we need to skip this line.
        const filteredLines = lines.filter((l) => l !== '\\ No newline at end of file');

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
    });

    return outDiff.join('\n');
};

/**
 * Creates tag for filter list metadata.
 *
 * @param tagName Name of the tag.
 * @param value Value of the tag.
 *
 * @returns Created tag in `! ${tagName}: ${value}` format.
 */
const createTag = (tagName: string, value: string): string => {
    return `! ${tagName}: ${value}`;
};

/**
 * Finds tag by tag name in filter content and if found - updates with provided
 * value, if not - creates new tag and insert to first line of the filter.
 *
 * @param tagName Name of the tag.
 * @param tagValue Value of the tag.
 * @param filterContent Array of filter's rules.
 *
 * @returns Filter content with updated or created tag.
 */
export const findAndUpdateTag = (
    tagName: string,
    tagValue: string,
    filterContent: string[],
): string[] => {
    // Make copy
    const updatedFile = filterContent.slice();
    const updatedTag = createTag(tagName, tagValue);

    if (parseTag(tagName, updatedFile)) {
        const oldExpiresTagIdx = updatedFile.findIndex((line) => line.includes(tagName));
        updatedFile[oldExpiresTagIdx] = updatedTag;
    } else {
        updatedFile.unshift(updatedTag);
    }

    return updatedFile;
};

/**
 * Updates `Diff-Path` tag in filter's rules, then join them via provided
 * `endOfFile` and save result to the specified path.
 *
 * @param diffPath Value of `Diff-Path` tag.
 * @param filterContent Filter's rules.
 * @param filterPath Where to save filter.
 * @param concatenationString What string use for join filter's rules.
 *
 * @returns Updated filter's rules.
 */
const updateDiffPathTagInFilter = async (
    diffPath: string,
    filterContent: string[],
    filterPath: string,
    concatenationString: string,
): Promise<string[]> => {
    const fileWithUpdatedTags = findAndUpdateTag(
        DIFF_PATH_TAG,
        diffPath,
        filterContent,
    );

    // Save filter with updated tag
    await fs.promises.writeFile(filterPath, fileWithUpdatedTags.join(concatenationString));

    return fileWithUpdatedTags;
};

/**
 * Scans `pathToPatches` for files with the "*.patch" pattern and deletes those
 * whose `mtime` has expired.
 *
 * @param pathToPatches Directory for scan.
 * @param deleteOlderThanSeconds The time to live for the patch in *seconds*.
 */
const deleteOutdatedPatches = async (
    pathToPatches: string,
    deleteOlderThanSeconds: number,
): Promise<void> => {
    const PATCH_EXTENSION = '.patch';
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

    await Promise.all(tasksToDeleteFiles);
};

/**
 * Generates a creation time timestamp based on the specified resolution.
 *
 * @param resolution The desired resolution for the timestamp (Minutes, Seconds,
 * or Hours).
 *
 * @returns A timestamp representing the creation time based on the specified
 * resolution.
 */
const generateCreationTime = (resolution: Resolution): number => {
    switch (resolution) {
        case Resolution.Minutes:
            return Math.round(Date.now() / (1000 * 60));
        case Resolution.Seconds:
            return Math.round(Date.now() / 1000);
        case Resolution.Hours:
        default:
            return Math.round(Date.now() / (1000 * 60 * 60));
    }
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
 * @param oldFilterPath The relative path to the old filter.
 * @param newFilterPath The relative path to the new filter.
 * @param patchesPath The relative path to the directory where the patch should
 * be saved. The patch filename will be `<path_to_patches>/$PATCH_VERSION.patch`,
 * where `$PATCH_VERSION` is the value of `Version` from `<old_filter>`.
 * @param name Name of the patch file, an arbitrary string to identify the patch.
 * Must be a string of length 1-64 with no spaces or other special characters.
 * @param time Expiration time for the diff update (the unit depends on `resolution`).
 * @param resolution Is an optional flag, that specifies the resolution for
 * both `expirationPeriod` and `epochTimestamp` (timestamp when the patch was
 * generated). It can be either `h` (hours), `m` (minutes) or `s` (seconds).
 * If `resolution` is not specified, it is assumed to be `h`.
 * @param checksum An optional flag, indicating whether it should calculate
 * the SHA sum for the filter and add it to the `diff` directive with the filter
 * name and the number of changed lines, following this format:
 * `diff name:[name] checksum:[checksum] lines:[lines]`.
 * @param deleteOlderThanSec An optional parameter, the time to live for the patch
 * in *seconds*. By default, it will be `604800` (7 days). The utility will
 * scan `<path_to_patches>` and delete patches whose `mtime` has expired.
 */
export const buildDiff = async (
    oldFilterPath: string,
    newFilterPath: string,
    patchesPath: string,
    name: string,
    time: number,
    resolution: Resolution = Resolution.Hours,
    checksum: boolean = false,
    deleteOlderThanSec: number = DEFAULT_PATCH_TTL_SECONDS,
): Promise<void> => {
    const prevListPath = path.resolve(process.cwd(), oldFilterPath);
    const newListPath = path.resolve(process.cwd(), newFilterPath);
    const pathToPatches = path.resolve(process.cwd(), patchesPath);

    const oldFile = await fs.promises.readFile(prevListPath, { encoding: 'utf-8' });
    let newFile = await fs.promises.readFile(newListPath, { encoding: 'utf-8' });

    const endOfOldFile = /\r\n$/gm.test(oldFile) ? '\r\n' : '\n';
    const endOfNewFile = /\r\n$/gm.test(newFile) ? '\r\n' : '\n';

    const oldFileSplitted = oldFile.split(endOfOldFile);
    let newFileSplitted = newFile.split(endOfNewFile);

    const oldFileDiff = parseTag(DIFF_PATH_TAG, oldFileSplitted);

    // Create folder for patches if it doesn't exists.
    if (!fs.existsSync(pathToPatches)) {
        await fs.promises.mkdir(pathToPatches, { recursive: true });
    }

    // Scan patches folder and delete outdated patches.
    await deleteOutdatedPatches(
        pathToPatches,
        deleteOlderThanSec,
    );

    const epochTimestamp = generateCreationTime(resolution);
    const newFileDiff = resolution && resolution !== Resolution.Hours
        ? `${name}-${resolution}-${epochTimestamp}-${time}.patch`
        : `${name}-${epochTimestamp}-${time}.patch`;

    if (oldFileDiff === newFileDiff) {
        // eslint-disable-next-line max-len
        throw new Error(`Old patch name "${oldFileDiff}" and new patch name "${newFileDiff}" are the same. Change the unit of measure to a smaller one or wait.`);
    }

    // Create empty patch for future version if it doesn't exists.
    const emptyPatchForNewVersion = path.join(pathToPatches, newFileDiff);
    if (!fs.existsSync(emptyPatchForNewVersion)) {
        await fs.promises.writeFile(emptyPatchForNewVersion, '');
    }

    // ! Important: Update `Diff-Path` before calculating the diff to ensure
    // that changing `Diff-Path` will be correctly included in the resulting
    // diff patch.
    const pathToPatchesRelativeToNewFilter = path.relative(
        path.dirname(newFilterPath),
        pathToPatches,
    );
    newFileSplitted = await updateDiffPathTagInFilter(
        path.join(pathToPatchesRelativeToNewFilter, newFileDiff),
        newFileSplitted,
        newListPath,
        endOfNewFile,
    );
    newFile = newFileSplitted.join(endOfNewFile);

    // We cannot save diff, if diff in old file doesn't exists.
    if (!oldFileDiff) {
        return;
    }

    // Calculate diff
    let patch = createPatch(oldFile, newFile);

    // Add checksum to patch if requested
    if (checksum) {
        const diffDirective = createDiffDirective(oldFileSplitted, newFile, patch);
        patch = diffDirective.concat('\n', patch);
    }

    // Save diff to patch file.
    await fs.promises.writeFile(
        path.join(pathToPatches, oldFileDiff),
        patch,
    );
};
