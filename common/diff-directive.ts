import { calculateChecksum } from './calculate-checksum';
import { DIFF_NAME_TAG } from './constants';
import { parseTag } from './parse-tag';

/**
 * Represents a Diff Directive, containing information about a diff operation.
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
export const createDiffDirective = (
    oldFilterContent: string[],
    newFilterContent: string,
    patchContent: string,
): string => {
    const diffName = parseTag(DIFF_NAME_TAG, oldFilterContent);
    const checksum = calculateChecksum(newFilterContent);
    const lines = patchContent.split('\n').length - 1;

    return diffName
        ? `diff name:${diffName} checksum:${checksum} lines:${lines}`
        : `diff checksum:${checksum} lines:${lines}`;
};

/**
 * Parses a string to extract a Diff Directive object.
 *
 * @param s The string to parse.
 * @returns A Diff Directive object if the string is a valid diff directive,
 * otherwise null.
 */
export const parseDiffDirective = (s: string): DiffDirective | null => {
    if (!s.startsWith('diff')) {
        return null;
    }

    const parts = s
        .split(' ')
        // skip 'diff'
        .slice(1);

    const nameExists = parts[0].startsWith('name');

    if (nameExists) {
        return {
            name: parts[0].slice('name:'.length),
            checksum: parts[1].slice('checksum:'.length),
            lines: Number(parts[2].slice('lines:'.length)),
        };
    }

    return {
        checksum: parts[0].slice('checksum:'.length),
        lines: Number(parts[1].slice('lines:'.length)),
    };
};
