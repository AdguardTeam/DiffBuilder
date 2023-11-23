import axios from 'axios';

import { parseTag } from '../common/parse-tag';
import { calculateChecksum } from '../common/calculate-checksum';
import { DIFF_PATH_TAG } from '../common/constants';
import { TypesOfChanges } from '../common/types-of-change';
import { parseDiffDirective } from '../common/diff-directive';
import { FILTER_3_V_1_0_1 } from '../tests/stubs/name';

/**
 * Represents an RCS (Revision Control System) operation.
 */
interface RcsOperation {
    /**
     * The type of RCS operation (Add or Delete).
     */
    typeOfOperation: TypesOfChanges;

    /**
     * The starting index of the operation.
     */
    startIndex: number;

    /**
     * The number of lines affected by the operation.
     */
    numberOfLines: number;
}

/**
 * Parses an RCS (Revision Control System) operation string into an object
 * containing operation details.
 *
 * @param rcsOperation The RCS operation string to parse.
 *
 * @returns An object with the parsed operation details.
 *
 * @throws Throws an error if the operation string is not valid.
 */
const parseRcsOperation = (rcsOperation: string): RcsOperation => {
    const [operationInfo, operationCounter] = rcsOperation.split(' ');

    const typeOfOperation = operationInfo[0];
    // Indexes in RCS are natural so we need to subtract 1.
    const startIndex = Number(operationInfo.slice(1)) - 1;
    const numberOfLines = Number(operationCounter);

    if (typeOfOperation !== TypesOfChanges.Add && typeOfOperation !== TypesOfChanges.Delete) {
        throw new Error(`Operation is not valid: cannot parse type: ${rcsOperation}`);
    }

    return {
        typeOfOperation,
        startIndex,
        numberOfLines,
    };
};

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
export const applyRcsPatch = (
    filterContent: string[],
    patch: string[],
    endOfFile: string,
    checksum?: string,
): string => {
    // Make a copy
    const lines = filterContent.slice();

    // NOTE: Note that the line indices start always refer to the text which is
    // transformed as it is in its original state, without taking the precending
    // changes into account, so we need to collect "virtual offset" between
    // "current changing" file and "old file".
    let currentOffset = 0;

    for (let index = 0; index < patch.length; index += 1) {
        const patchLine = patch[index];

        const parsedRcsOperation = parseRcsOperation(patchLine);
        const {
            typeOfOperation,
            startIndex,
            numberOfLines,
        } = parsedRcsOperation;

        const startIndexWithOffset = startIndex + currentOffset;

        if (typeOfOperation === TypesOfChanges.Delete) {
            lines.splice(startIndexWithOffset, numberOfLines);

            currentOffset -= numberOfLines;
        }

        if (typeOfOperation === TypesOfChanges.Add) {
            const stringsToAdd: string[] = [];
            let nStringsToAdd = numberOfLines;
            // Scan strings to add starting from the second line.
            let scanFrom = index + 1;
            while (nStringsToAdd > 0 && scanFrom < patch.length) {
                stringsToAdd.push(patch[scanFrom]);
                scanFrom += 1;
                nStringsToAdd -= 1;
            }
            index += stringsToAdd.length;

            if (startIndexWithOffset < 0) {
                lines.unshift(...stringsToAdd);
            } else if (startIndexWithOffset > lines.length) {
                lines.push(...stringsToAdd);
            } else {
                lines.splice(startIndexWithOffset + 1, 0, ...stringsToAdd);
            }

            currentOffset += numberOfLines;
        }
    }

    const updatedFilter = lines.join(endOfFile);

    if (checksum) {
        const c = calculateChecksum(updatedFilter);

        if (c !== checksum) {
            throw new Error('Checksums are not equal.');
        }
    }

    return updatedFilter;
};

/**
 * Updates a filter content using an RCS (Revision Control System) patch
 * retrieved from a specified URL.
 *
 * @param filterUrl The URL where the RCS patch can be obtained.
 * @param filterContent The original filter content as a string.
 *
 * @returns The updated filter content after applying the patch.
 */
export const applyPatch = async (
    filterUrl: string,
    filterContent: string,
): Promise<string> => {
    const filterLines = filterContent.split(/\r?\n/);
    const diffPath = parseTag(DIFF_PATH_TAG, filterLines);

    if (!diffPath) {
        console.warn('Filter is not support diff updates');
        return filterContent;
    }

    const patchUrl = filterUrl + diffPath;
    let patch: string[] = [];

    try {
        const request = await axios.get(patchUrl);

        if (request.status === axios.HttpStatusCode.NotFound || request.status === axios.HttpStatusCode.NoContent) {
            console.info('Update is not available.');
            return filterContent;
        }

        if (request.status === axios.HttpStatusCode.Ok && request.data === '') {
            console.info('Update is not available.');
            return filterContent;
        }

        patch = request.data.split(/\r?\n/);
    } catch (e) {
        console.error('Cannot load patch due to: ', e);

        return filterContent;
    }

    try {
        const diffDirective = parseDiffDirective(filterLines[0]);
        const updatedFilter = applyRcsPatch(
            filterLines,
            patch,
            filterContent.endsWith('\r\n') ? '\r\n' : '\n',
            diffDirective ? diffDirective.checksum : undefined,
        );

        return updatedFilter;
    } catch (e) {
        console.warn('Error during applying patch: ', e);

        return filterContent;
    }
};
