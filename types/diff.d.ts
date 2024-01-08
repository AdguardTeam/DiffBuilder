declare module 'diff/src/index.js' {
    export interface BaseOptions {
        /**
         * `true` to ignore casing difference.
         * @default false
         */
        ignoreCase?: boolean | undefined;
    }

    export interface LinesOptions extends BaseOptions {
        /**
         * `true` to ignore leading and trailing whitespace. This is the same as `diffTrimmedLines()`.
         */
        ignoreWhitespace?: boolean | undefined;

        /**
         * `true` to treat newline characters as separate tokens. This allows for changes to the newline structure
         * to occur independently of the line content and to be treated as such. In general this is the more
         * human friendly form of `diffLines()` and `diffLines()` is better suited for patches and other computer
         * friendly output.
         */
        newlineIsToken?: boolean | undefined;
    }

    export interface PatchOptions extends LinesOptions {
        /**
         * Describes how many lines of context should be included.
         * @default 4
         */
        context?: number | undefined;
    }

    export interface Hunk {
        oldStart: number;
        oldLines: number;
        newStart: number;
        newLines: number;
        lines: string[];
        // Line Delimiters is only returned by parsePatch()
        linedelimiters?: string[];
    }

    export interface ParsedDiff {
        index?: string | undefined;
        oldFileName?: string | undefined;
        newFileName?: string | undefined;
        oldHeader?: string | undefined;
        newHeader?: string | undefined;
        hunks: Hunk[];
    }

    /**
     * This method is similar to `createTwoFilesPatch()`, but returns a data structure suitable for further processing.
     * Parameters are the same as `createTwoFilesPatch()`.
     *
     * @param oldFileName String to be output in the `oldFileName` hunk property.
     * @param newFileName String to be output in the `newFileName` hunk property.
     * @param oldStr Original string value.
     * @param newStr New string value.
     * @param oldHeader Additional information to include in the `oldHeader` hunk property.
     * @param newHeader Additional information to include in the `newHeader` hunk property.
     * @param options Options.
     *
     * @returns An object with an array of hunk objects.
     */
    export function structuredPatch(
        oldFileName: string,
        newFileName: string,
        oldStr: string,
        newStr: string,
        oldHeader?: string,
        newHeader?: string,
        options?: PatchOptions,
    ): ParsedDiff;
}
