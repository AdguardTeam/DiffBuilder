import path from 'path';
import fs from 'fs';

import { CHECKSUM_TAG, DIFF_PATH_TAG } from '../common/constants';
import { createDiffDirective, parseDiffDirective } from '../common/diff-directive';
import { calculateChecksumMD5 } from '../common/calculate-checksum';
import {
    Resolution,
    createPatchName,
    parsePatchName,
    timestampWithResolutionToMs,
} from '../common/patch-name';
import { splitByLines } from '../common/split-by-lines';
import { createLogger } from '../common/create-logger';
import {
    createTag,
    parseTag,
    removeTag,
} from './tags';
import { applyRcsPatch } from '../diff-updater/update';
import { getErrorMessage } from '../common/get-error-message';
import { spawnDiff } from '../common/spawn-diff';
import { getTempFilePaths } from '../common/get-temp-file-paths';
import { writeToTempFiles, deleteTempFiles } from '../common/temp-files-utils';

const DEFAULT_PATCH_TTL_SECONDS = 60 * 60 * 24 * 7;
// Default maximum patch size in bytes (1 MB).
const DEFAULT_MAX_PATCH_SIZE = 1024 * 1024;

let log: (message: string) => void;

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
     * The relative path to the directory with patches.
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
     * scan `<path_to_patches>` and delete patches whose created epoch timestamp
     * has expired.
     */
    deleteOlderThanSec?: number;

    /**
     * An optional maximum size of the generated patch in *bytes*.
     * If the generated patch exceeds this size, it will not be created:
     * the new filter will be published without the `Diff-Path` tag, so
     * clients will download the full filter instead of a patch, and stale
     * empty placeholder patches will be deleted from the patches folder.
     * By default, it is `1048576` (1 MB).
     */
    maxPatchSize?: number;

    /**
     * Verbose mode.
     */
    verbose?: boolean;
}

/**
 * Creates patch in [RCS format](https://www.gnu.org/software/diffutils/manual/diffutils.html#RCS).
 *
 * @param oldContent Content of old file.
 * @param newContent Content of new file.
 *
 * @throws Error if the patch creation fails.
 *
 * @returns Promise resolving to the difference in RCS format.
 */
export const createPatch = async (oldContent: string, newContent: string): Promise<string> => {
    const tempFiles = getTempFilePaths();

    try {
        // Wait for files to be written before creating diff
        await writeToTempFiles({
            oldFilePath: tempFiles.oldFilePath,
            oldContent,
            newFilePath: tempFiles.newFilePath,
            newContent,
        });

        // Generate the diff using our utility function
        const patch = await spawnDiff(tempFiles.oldFilePath, tempFiles.newFilePath);

        return patch;
    } catch (e) {
        log(`Failed to create a patch: ${getErrorMessage(e)}`);
        throw e;
    } finally {
        await deleteTempFiles(tempFiles.oldFilePath, tempFiles.newFilePath, log);
    }
};

/**
 * Scans `absolutePatchesPath` for files with the `*.${PATCH_EXTENSION}` pattern and deletes
 * those whose created epoch timestamp has expired and whose are not empty.
 *
 * @param absolutePatchesPath Directory for scan.
 * @param deleteOlderThanSeconds The time to live for the patch in *seconds*.
 *
 * @see {@link PATCH_EXTENSION}
 *
 * @returns Returns number of deleted patches.
 */
const deleteOutdatedPatches = async (
    absolutePatchesPath: string,
    deleteOlderThanSeconds: number,
): Promise<number> => {
    const files = await fs.promises.readdir(absolutePatchesPath);
    const tasksToDeleteFiles: Promise<void>[] = [];
    for (const file of files) {
        if (!file.endsWith(PATCH_EXTENSION)) {
            log(`Skipped deleting file "${file}" because its extension is not "${PATCH_EXTENSION}"`);
            continue;
        }

        const filePath = path.join(absolutePatchesPath, file);

        // eslint-disable-next-line no-await-in-loop
        const { size } = await fs.promises.stat(filePath);
        // If size is 0 - it means, that this patch is last active and we cannot
        // delete it even if it is outdated, because there is active link to
        // this patch in the filter's Diff-Path tag.
        if (size === 0) {
            log(`Skipped deleting file "${file}" because it is empty.`);
            continue;
        }

        const {
            resolution,
            epochTimestamp,
        } = parsePatchName(file);

        const createdMs = timestampWithResolutionToMs(epochTimestamp, resolution);

        const deleteOlderThanMs = deleteOlderThanSeconds * 1000;
        const deleteOlderThanDateMs = new Date().getTime() - deleteOlderThanMs;

        if (createdMs < deleteOlderThanDateMs) {
            log(`Deleting "${file}".`);
            // eslint-disable-next-line no-await-in-loop
            tasksToDeleteFiles.push(fs.promises.rm(filePath));
        } else {
            log(`Timestamp of "${file}" has not expired, deleting is skipped.`);
        }
    }

    const deleted = await Promise.all(tasksToDeleteFiles);

    return deleted.length;
};

/**
 * Scans `absolutePatchesPath` for empty (zero-byte) `*.${PATCH_EXTENSION}`
 * files and deletes them.
 *
 * An empty patch is a placeholder for a version of a filter whose patch has
 * not been created yet. Stale placeholders must be deleted when their patch
 * will never be created, so that the patches folder contains at most one
 * empty patch — the placeholder for the latest version of the filter.
 *
 * @param absolutePatchesPath Directory for scan.
 *
 * @see {@link PATCH_EXTENSION}
 *
 * @returns Returns number of deleted empty patches.
 */
const deleteEmptyPatches = async (absolutePatchesPath: string): Promise<number> => {
    const files = await fs.promises.readdir(absolutePatchesPath);
    const tasksToDeleteFiles: Promise<void>[] = [];
    for (const file of files) {
        if (!file.endsWith(PATCH_EXTENSION)) {
            continue;
        }

        const filePath = path.join(absolutePatchesPath, file);

        // eslint-disable-next-line no-await-in-loop
        const { size } = await fs.promises.stat(filePath);
        if (size === 0) {
            log(`Deleting empty patch "${file}".`);
            // eslint-disable-next-line no-await-in-loop
            tasksToDeleteFiles.push(fs.promises.rm(filePath));
        }
    }

    const deleted = await Promise.all(tasksToDeleteFiles);

    if (deleted.length > 0) {
        log(`Deleted ${deleted.length} empty patches from "${absolutePatchesPath}".`);
    }

    return deleted.length;
};

/**
 * Checks if the provided file content contains a checksum tag within its first 200 characters.
 * This approach is selected to exclude parsing checksums from included filters.
 *
 * @param file The file content as a string.
 *
 * @returns `true` if the checksum tag is found, otherwise `false`.
 */
export const hasChecksum = (file: string): boolean => {
    const partOfFile = file.substring(0, 200);
    const lines = splitByLines(partOfFile);

    return lines.some((line) => line.startsWith(`! ${CHECKSUM_TAG}`));
};

/**
 * Updates the 'Diff-Path' tag and optionally recalculates and adds a new
 * checksum tag in a provided array of filter lines.
 *
 * @param filterContent Filter content that needs to be updated.
 * @param diffPathTagValue The new value to be set for the 'Diff-Path' tag.
 *
 * @returns Updated filter content.
 */
export const updateTags = (
    filterContent: string,
    diffPathTagValue: string,
): string => {
    // Split the content of the filters into lines.
    let newFileSplitted = splitByLines(filterContent);

    let userAgent: string | undefined;
    // User agent tag.
    if (newFileSplitted[0].startsWith('![') || newFileSplitted[0].startsWith('[')) {
        userAgent = newFileSplitted.shift();
    }

    // Remove tags 'Diff-Path' and 'Checksum' from new filterContent.
    newFileSplitted = removeTag(DIFF_PATH_TAG, removeTag(CHECKSUM_TAG, newFileSplitted));

    const lineEnding = newFileSplitted[0].endsWith('\r\n') ? '\r\n' : '\n';

    const diffPath = createTag(DIFF_PATH_TAG, diffPathTagValue, lineEnding);
    newFileSplitted.unshift(diffPath);

    if (userAgent !== undefined) {
        newFileSplitted.unshift(userAgent);
    }

    // If filter had checksum, calculate and insert a new checksum tag at the start of the filter
    if (hasChecksum(filterContent)) {
        const updatedChecksum = calculateChecksumMD5(newFileSplitted.join(''));
        const checksumTag = createTag(CHECKSUM_TAG, updatedChecksum, lineEnding);

        if (userAgent !== undefined) {
            // Insert Checksum after the userAgent header.
            newFileSplitted.splice(1, 0, checksumTag);
        } else {
            newFileSplitted.unshift(checksumTag);
        }
    }

    return newFileSplitted.join('');
};

/**
 * Applies the patch to the old file and compares the result with the new file.
 *
 * @param oldFile The original file content as a string.
 * @param newFile The expected file content after the patch is applied.
 * @param patch The patch content as a string.
 *
 * @returns The validation result: `{ valid: true }` if the patched old file
 * matches the new file; otherwise `{ valid: false, error }` with the error
 * that prevented the patch from being applied or the mismatch error.
 */
export const validatePatch = (
    oldFile: string,
    newFile: string,
    patch: string,
): { valid: true } | { valid: false, error: unknown } => {
    const patchLines = splitByLines(patch);

    const diffDirective = parseDiffDirective(patchLines[0]);

    try {
        const updatedFile = applyRcsPatch(
            splitByLines(oldFile),
            diffDirective ? patchLines.slice(1) : patchLines,
            diffDirective ? diffDirective.checksum : undefined,
        );

        if (updatedFile !== newFile) {
            return {
                valid: false,
                error: new Error('old file with applied patch is not equal to new file.'),
            };
        }

        return { valid: true };
    } catch (e) {
        log(`Failed to apply patch to the old file: ${getErrorMessage(e)}`);

        return { valid: false, error: e };
    }
};

/**
 * Determines if there are significant changes between two files, excluding
 * changes in 'Checksum' and 'Diff-Path' tags.
 * The function splits the file contents into lines, removes the mentioned tags,
 * and then compares the contents to determine if there are meaningful changes.
 *
 * @param oldFile The content of the old file as a string.
 * @param newFile The content of the new file as a string.
 *
 * @returns `true` if there are significant changes, otherwise `false`.
 */
export const hasChanges = (
    oldFile: string,
    newFile: string,
): boolean => {
    // Split the content of the filters into lines.
    let oldFileSplitted = splitByLines(oldFile);
    let newFileSplitted = splitByLines(newFile);

    // Remove 'Checksum' and 'Diff-Path' tags from both old and new filters.
    oldFileSplitted = removeTag(DIFF_PATH_TAG, removeTag(CHECKSUM_TAG, oldFileSplitted));
    newFileSplitted = removeTag(DIFF_PATH_TAG, removeTag(CHECKSUM_TAG, newFileSplitted));

    const oldFileHasChecksum = hasChecksum(oldFile);
    const newFileHasChecksum = hasChecksum(newFile);

    // Determine if there are meaningful changes in the files, excluding the 'Diff-Path' and 'Checksum' tags.
    // This comparison considers both the content and the presence of checksum tags in the old and new files.
    if (oldFileSplitted.join('') === newFileSplitted.join('') && oldFileHasChecksum === newFileHasChecksum) {
        return false;
    }

    return true;
};

/**
 * Asynchronously updates the 'Diff-Path' tag in a new filter file and creates
 * a diff patch compared to an old file.
 * This function ensures that changes to 'Diff-Path' and 'Checksum' are correctly
 * included in the diff patch.
 * It throws an error if the old and new patch names are the same.
 *
 * @param oldFile The content of the old file as a string.
 * @param newFile The content of the new file as a string.
 * @param checksumFlag Flag to determine if a checksum should be added to the patch.
 * @param pathToPatchesRelativeToNewFilter The relative path to the patches directory from the new filter's location.
 * @param newFilePatchName The proposed diff name for the new file.
 * @param oldFilePatchName The diff name in the old file, or null if not present.
 *
 * @throws Error if the old and new patch names are the same.
 *
 * @returns A promise that resolves to an object containing the updated content
 * of the new file and the generated diff patch.
 */
export const updateFileAndCreatePatch = async (
    oldFile: string,
    newFile: string,
    checksumFlag: boolean,
    pathToPatchesRelativeToNewFilter: string,
    newFilePatchName: string,
    oldFilePatchName: string | null,
): Promise<{
    newFileWithUpdatedTags: string,
    patch: string,
}> => {
    // Verify that the patch names are not the same.
    if (oldFilePatchName === newFilePatchName) {
        // eslint-disable-next-line max-len
        throw new Error(`The old patch name "${oldFilePatchName}" and the new patch name "${newFilePatchName}" are the same. Consider changing the unit of measure or waiting.`);
    }

    // Note: Update 'Diff-Path' and 'Checksum' before calculating the diff
    // to ensure their changes are included in the resulting diff patch.
    const newFilterDiffPathTagValue = path.join(pathToPatchesRelativeToNewFilter, newFilePatchName);

    const newFileWithUpdatedTags = updateTags(
        newFile,
        newFilterDiffPathTagValue,
    );

    // Generate the diff patch.
    let patch = await createPatch(oldFile, newFileWithUpdatedTags);

    // Optionally add a checksum to the patch.
    if (checksumFlag) {
        const diffDirective = createDiffDirective(oldFilePatchName, newFileWithUpdatedTags, patch);
        patch = diffDirective.concat('\n', patch);
    }

    return {
        newFileWithUpdatedTags,
        patch,
    };
};

/**
 * Asynchronously builds a diff between two filter files and handles related
 * file operations. Resolves paths, creates necessary folders, deletes outdated
 * patches, and checks for changes in filter content.
 * If there are changes other than those with 'Diff-Path' and 'Checksum' tags,
 * it updates the content of the new filter file with new 'Diff-Path'
 * and 'Checksum' tags and creates patch files accordingly.
 *
 * @param params The parameters including paths, resolution, and other settings
 * for diff generation.
 *
 * @throws Error if `maxPatchSize` is not a positive finite number.
 * @throws Error if the generated patch fails self-validation: the patch cannot
 * be applied to the old filter or its result differs from the new filter.
 *
 * @returns A promise that resolves when the diff operation is complete.
 */
export const buildDiff = async (params: BuildDiffParams): Promise<void> => {
    const {
        oldFilterPath,
        newFilterPath,
        patchesPath,
        name,
        time,
        resolution = Resolution.Hours,
        checksum: checksumFlag = false,
        deleteOlderThanSec = DEFAULT_PATCH_TTL_SECONDS,
        maxPatchSize = DEFAULT_MAX_PATCH_SIZE,
        verbose = false,
    } = params;

    // Validate the limit here: the default above only covers `undefined`, and
    // a non-finite or non-positive value would otherwise silently skip every
    // patch or disable the limit.
    if (!Number.isFinite(maxPatchSize) || maxPatchSize <= 0) {
        throw new Error('Maximum patch size should be a positive number.');
    }

    log = createLogger(verbose);

    // Resolve all necessary paths.
    const absoluteOldListPath = path.resolve(process.cwd(), oldFilterPath);
    const absoluteNewListPath = path.resolve(process.cwd(), newFilterPath);
    const absolutePatchesPath = path.resolve(process.cwd(), patchesPath);
    const pathToPatchesRelativeToNewFilter = path.relative(
        path.dirname(newFilterPath),
        absolutePatchesPath,
    );

    if (!fs.existsSync(absoluteOldListPath)) {
        // eslint-disable-next-line max-len
        log(`Older version for filter "${newFilterPath}" not found. Checked path: "${absolutePatchesPath}". Looks like it is the first version of the filter. Skipping diff generation.`);
        return;
    }

    log(`Checking diff between "${absoluteOldListPath}" and "${absoluteNewListPath}".`);
    log(`Path to patches: "${absolutePatchesPath}".`);

    // Create the patches folder if it doesn't exist.
    if (!fs.existsSync(absolutePatchesPath)) {
        await fs.promises.mkdir(absolutePatchesPath, { recursive: true });
        log(`Created missing patches folder at "${absolutePatchesPath}".`);
    }

    log(`Checking patches to delete in the patches folder: "${absolutePatchesPath}"`);

    // Scan the patches folder and delete outdated patches.
    const deleted = await deleteOutdatedPatches(
        absolutePatchesPath,
        deleteOlderThanSec,
    );

    if (deleted > 0) {
        log(`Deleted ${deleted} outdated patches from "${absolutePatchesPath}".`);
    }

    // Read the content of the filters.
    const oldFile = await fs.promises.readFile(absoluteOldListPath, { encoding: 'utf-8' });
    const newFile = await fs.promises.readFile(absoluteNewListPath, { encoding: 'utf-8' });

    // Check for any changes except changes with Diff-Path and Checksum
    // in the filters.
    if (!hasChanges(oldFile, newFile)) {
        // If no significant changes, undo removal of 'Diff-Path' (it happens
        // by run `compiler` which currently not supported `Diff-Path` tag and
        // always remove it, even if filter has not changes)
        // and save the old file content to the new file.
        await fs.promises.writeFile(absoluteNewListPath, oldFile);

        log('No significant changes found.');
        log(`Reverted any removal of 'Diff-Path' in the new filter "${absoluteNewListPath}".`);

        return;
    }

    // Retrieve and save the 'Diff-Path' tag from the old filter before removal.
    let oldFilePatchName = parseTag(DIFF_PATH_TAG, splitByLines(oldFile));
    // Remove resourceName part after "#" sign if it exists.
    oldFilePatchName = oldFilePatchName ? oldFilePatchName.split('#')[0] : null;

    // Generate a name for the new patch.
    const newFilePatchName = createPatchName({ name, resolution, time });

    const {
        newFileWithUpdatedTags,
        patch,
    } = await updateFileAndCreatePatch(
        oldFile,
        newFile,
        checksumFlag,
        pathToPatchesRelativeToNewFilter,
        newFilePatchName,
        oldFilePatchName,
    );

    const patchSize = Buffer.byteLength(patch, 'utf-8');

    if (patchSize > maxPatchSize) {
        log(`The patch size (${patchSize} bytes) exceeds the maximum allowed patch size (${maxPatchSize} bytes).`);
        log('The patch will not be created, and the new filter will be published without the "Diff-Path" tag.');
        log('Clients will download the full filter instead of applying a patch.');

        await deleteEmptyPatches(absolutePatchesPath);

        return;
    }

    // Note: the new filter and patch files are only written after this check,
    // so a failed validation leaves the previous filter content untouched:
    // no updated 'Diff-Path' tag and no placeholder patch. Expired patches
    // may already have been deleted above.
    const validation = validatePatch(oldFile, newFileWithUpdatedTags, patch);
    if (!validation.valid) {
        throw new Error(
            `Validating generated patch failed: ${getErrorMessage(validation.error)}`,
            { cause: validation.error },
        );
    }

    // Write the updated content to the new filter with an updated 'Diff-Path' and 'Checksum'.
    await fs.promises.writeFile(absoluteNewListPath, newFileWithUpdatedTags);
    log(`Updated 'Diff-Path' and 'Checksum' tags in the new filter at "${absoluteNewListPath}".`);

    // If 'Diff-Path' is not found in the old filter, a patch for the old file
    // cannot be created, and empty placeholders left by previous failed builds
    // will never be filled. Delete them before creating a new placeholder so
    // that the patches folder contains exactly one empty patch.
    if (!oldFilePatchName) {
        await deleteEmptyPatches(absolutePatchesPath);
    }

    // Create an empty patch for the future version if it doesn't exist.
    const emptyPatchForNewVersion = path.join(absolutePatchesPath, newFilePatchName);
    if (!fs.existsSync(emptyPatchForNewVersion)) {
        await fs.promises.writeFile(emptyPatchForNewVersion, '');
        log(`Created a patch for the new filter at ${emptyPatchForNewVersion}.`);
    }

    // If 'Diff-Path' is not found in the old filter, a patch for the old file
    // cannot be created.
    if (!oldFilePatchName) {
        log('No "Diff-Path" found in the old filter. Cannot create a patch for the old file.');
        return;
    }

    // 'Diff-Path' contains a path relative to the filter path, requiring path resolution.
    // Note: resolve this relative patch path to the new filter path to ensure
    // that folder with new filter will contain three main things: new filter itself,
    // patch to old version and new empty patch for future changes.
    const oldFilePatch = path.resolve(path.dirname(absoluteNewListPath), oldFilePatchName);
    // Save the diff to the patch file.
    await fs.promises.writeFile(oldFilePatch, patch);
    log(`Saved the patch to: ${oldFilePatch}`);
};
