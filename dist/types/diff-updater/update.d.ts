/**
 * Applies an RCS (Revision Control System) patch to a filter content.
 *
 * @param filterContent An array of strings representing the original filter content.
 * @param patch An array of strings representing the RCS patch to apply.
 * @param checksum An optional checksum to validate the updated filter content.
 * @returns The updated filter content after applying the patch.
 * @throws If the provided checksum doesn't match the calculated checksum.
 */
export declare const applyRcsPatch: (filterContent: string[], patch: string[], checksum?: string) => string;
/**
 * Updates a filter's content using an RCS (Revision Control System) patch retrieved from a specified URL.
 *
 * @param filterUrl The URL from which the RCS patch can be obtained.
 * @param filterContent The original filter content as a string.
 * @param callStack The number of recursive calls.
 * @param verbose Verbose mode.
 *
 * @returns The updated filter content after applying the patch,
 * or null if there is no Diff-Path tag in the filter.
 *
 * @throws {Error} If there is an error during the patch application process
 * or during network request.
 */
export declare const applyPatch: (filterUrl: string, filterContent: string, callStack?: number, verbose?: boolean) => Promise<string | null>;
