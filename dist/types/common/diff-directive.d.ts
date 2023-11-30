/**
 * Represents a Diff Directive, containing information about the patch.
 */
interface DiffDirective {
    /**
     * The name associated with the directive.
     */
    name?: string;
    /**
     * The checksum value of the file after applying the patch.
     */
    checksum: string;
    /**
     * The number of lines affected by the diff operation.
     */
    lines: number;
    /**
     * The timestamp of creating patch in milliseconds.
     */
    timestampMs: number;
}
/**
 * Creates `diff` directive with `Diff-Name` from filter (if found) and with
 * checksum of the new filter and number of lines of the patch.
 *
 * @param oldFilterContent Old filter content.
 * @param newFilterContent New filter content.
 * @param patchContent Patch content.
 *
 * @returns Created `diff` directive.
 */
export declare const createDiffDirective: (oldFilterContent: string[], newFilterContent: string, patchContent: string) => string;
/**
 * Parses a string to extract a Diff Directive object.
 *
 * @param s The string to parse.
 * @returns A Diff Directive object if the string is a valid diff directive,
 * otherwise null.
 */
export declare const parseDiffDirective: (s: string) => DiffDirective | null;
export {};
