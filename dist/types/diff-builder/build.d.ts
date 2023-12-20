import { TypesOfChanges } from '../common/types-of-change';
import { Resolution } from '../common/patch-name';
export declare const PATCH_EXTENSION = ".patch";
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
export declare const detectTypeOfChanges: (line: string) => TypesOfChanges | null;
/**
 * Creates patch in [RCS format](https://www.gnu.org/software/diffutils/manual/diffutils.html#RCS).
 *
 * @param oldFile Old file.
 * @param newFile New file.
 *
 * @returns Difference between old and new files in RCS format.
 */
export declare const createPatch: (oldFile: string, newFile: string) => string;
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
 * @param needToUpdateChecksum
 * @returns A new array of filter lines with the updated 'Diff-Path' tag and recalculated checksum.
 */
export declare const updateDiffPathInNewFilter: (filterToUpdate: string[], diffPathTagValue: string, needToUpdateChecksum: boolean) => string[];
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
export declare const buildDiff: (params: BuildDiffParams) => Promise<void>;
