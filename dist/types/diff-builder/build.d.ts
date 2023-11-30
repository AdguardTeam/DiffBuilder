import { TypesOfChanges } from '../common/types-of-change';
export declare enum Resolution {
    Hours = "h",
    Minutes = "m",
    Seconds = "s"
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
 * Finds tag by tag name in filter content and if found - updates with provided
 * value, if not - creates new tag and insert to first line of the filter.
 *
 * @param tagName Name of the tag.
 * @param tagValue Value of the tag.
 * @param filterContent Array of filter's rules.
 *
 * @returns Filter content with updated or created tag.
 */
export declare const findAndUpdateTag: (tagName: string, tagValue: string, filterContent: string[]) => string[];
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
 * @param verbose Verbose mode.
 */
export declare const buildDiff: (oldFilterPath: string, newFilterPath: string, patchesPath: string, name: string, time: number, resolution?: Resolution, checksum?: boolean, deleteOlderThanSec?: number, verbose?: boolean) => Promise<void>;
