'use strict';

var axios = require('axios');
var crypto = require('crypto');

/**
 * Finds value of specified header tag in filter rules text.
 *
 * @param tagName Filter header tag name.
 * @param rules Lines of filter rules text.
 *
 * @returns Value of specified header tag or null if tag not found.
 */
const parseTag = (tagName, rules) => {
    // Lines of filter metadata to parse
    const AMOUNT_OF_LINES_TO_PARSE = 50;
    // Look up no more than 50 first lines
    const maxLines = Math.min(AMOUNT_OF_LINES_TO_PARSE, rules.length);
    for (let i = 0; i < maxLines; i += 1) {
        const rule = rules[i];
        if (!rule) {
            continue;
        }
        const search = `! ${tagName}: `;
        const indexOfSearch = rule.indexOf(search);
        if (indexOfSearch >= 0) {
            return rule.substring(indexOfSearch + search.length);
        }
    }
    return null;
};

/**
 * Calculates SHA1 checksum for patch.
 *
 * @param content Content to hash.
 *
 * @returns SHA1 checksum for patch.
 */
const calculateChecksum = (content) => {
    const hash = crypto.createHash('sha1');
    const data = hash.update(content, 'utf-8');
    return data.digest('hex');
};

const DIFF_PATH_TAG = 'Diff-Path';

// Type of diff change.
var TypesOfChanges;
(function (TypesOfChanges) {
    TypesOfChanges["Add"] = "a";
    TypesOfChanges["Delete"] = "d";
})(TypesOfChanges || (TypesOfChanges = {}));

/**
 * Parses a string to extract a Diff Directive object.
 *
 * @param s The string to parse.
 * @returns A Diff Directive object if the string is a valid diff directive,
 * otherwise null.
 */
const parseDiffDirective = (s) => {
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
            timestampMs: Number(parts[3].slice('timestamp:'.length)),
        };
    }
    return {
        checksum: parts[0].slice('checksum:'.length),
        lines: Number(parts[1].slice('lines:'.length)),
        timestampMs: Number(parts[2].slice('timestamp:'.length)),
    };
};

var HttpStatusCode;
(function (HttpStatusCode) {
    HttpStatusCode[HttpStatusCode["NotFound"] = 404] = "NotFound";
    HttpStatusCode[HttpStatusCode["NoContent"] = 204] = "NoContent";
    HttpStatusCode[HttpStatusCode["Ok"] = 200] = "Ok";
})(HttpStatusCode || (HttpStatusCode = {}));
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
const parseRcsOperation = (rcsOperation) => {
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
const applyRcsPatch = (filterContent, patch, endOfFile, checksum) => {
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
        const { typeOfOperation, startIndex, numberOfLines, } = parsedRcsOperation;
        const startIndexWithOffset = startIndex + currentOffset;
        if (typeOfOperation === TypesOfChanges.Delete) {
            lines.splice(startIndexWithOffset, numberOfLines);
            currentOffset -= numberOfLines;
        }
        if (typeOfOperation === TypesOfChanges.Add) {
            const stringsToAdd = [];
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
            }
            else if (startIndexWithOffset > lines.length) {
                lines.push(...stringsToAdd);
            }
            else {
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
const applyPatch = async (filterUrl, filterContent) => {
    const filterLines = filterContent.split(/\r?\n/);
    const diffPath = parseTag(DIFF_PATH_TAG, filterLines);
    if (!diffPath) {
        console.warn('Filter is not support diff updates');
        return filterContent;
    }
    let patch = [];
    try {
        // Cut last part of path
        const baseURL = filterUrl
            .split('/')
            .slice(0, -1)
            .join('/');
        const request = await axios.get(diffPath, { baseURL });
        if (request.status === HttpStatusCode.NotFound || request.status === HttpStatusCode.NoContent) {
            console.info('Update is not available.');
            return filterContent;
        }
        if (request.status === HttpStatusCode.Ok && request.data === '') {
            console.info('Update is not available.');
            return filterContent;
        }
        patch = request.data.split(/\r?\n/);
    }
    catch (e) {
        console.error('Cannot load patch due to: ', e);
        return filterContent;
    }
    try {
        const diffDirective = parseDiffDirective(filterLines[0]);
        const updatedFilter = applyRcsPatch(filterLines, patch, filterContent.endsWith('\r\n') ? '\r\n' : '\n', diffDirective ? diffDirective.checksum : undefined);
        return updatedFilter;
    }
    catch (e) {
        console.warn('Error during applying patch: ', e);
        return filterContent;
    }
};

exports.applyPatch = applyPatch;
