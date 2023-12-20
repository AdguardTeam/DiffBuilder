/**
 * Interface describing the parameters of the applyPatch function.
 */
export interface ApplyPatchParams {
    /**
     * The URL from which the RCS patch can be obtained.
     * @type {string}
     */
    filterUrl: string;
    /**
     * The original filter content as a string.
     * @type {string}
     */
    filterContent: string;
    /**
     * Whether to enable verbose mode.
     * @type {boolean}
     */
    verbose?: boolean;
}
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
 * Applies an RCS (Revision Control System) patch to update a filter's content.
 *
 * @param params The parameters for applying the patch {@link ApplyPatchParams}.
 *
 * @returns A promise that resolves to the updated filter content after applying the patch,
 * or null if there is no Diff-Path tag in the filter.
 *
 * @throws {Error} If there is an error during the patch application process
 * or during network request.
 */
export declare const applyPatch: (params: ApplyPatchParams) => Promise<string | null>;
