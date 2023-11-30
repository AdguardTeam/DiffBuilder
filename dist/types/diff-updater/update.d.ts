/**
 * Applies an RCS (Revision Control System) patch to a filter content.
 *
 * @param filterContent An array of strings representing the original filter content.
 * @param patch An array of strings representing the RCS patch to apply.
 * @param endOfFile A string representing the end of file character.
 * @param checksum An optional checksum to validate the updated filter content.
 * @returns The updated filter content after applying the patch.
 * @throws If the provided checksum doesn't match the calculated checksum.
 */
export declare const applyRcsPatch: (filterContent: string[], patch: string[], endOfFile: string, checksum?: string) => string;
/**
 * Updates a filter content using an RCS (Revision Control System) patch
 * retrieved from a specified URL.
 *
 * @param filterUrl The URL where the RCS patch can be obtained.
 * @param filterContent The original filter content as a string.
 *
 * @returns The updated filter content after applying the patch.
 */
export declare const applyPatch: (filterUrl: string, filterContent: string) => Promise<string>;
