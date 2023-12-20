import { parseTag } from '../common/parse-tag';

/**
 * Creates tag for filter list metadata.
 *
 * @param tagName Name of the tag.
 * @param value Value of the tag.
 *
 * @returns Created tag in `! ${tagName}: ${value}` format.
 */
export const createTag = (tagName: string, value: string): string => {
    return `! ${tagName}: ${value}\n`;
};

/**
 * Removes a specified tag from an array of filter content strings.
 * This function searches for the first occurrence of the specified tag within
 * the array and removes the entire line containing that tag. If the tag is not
 * found, the array remains unchanged.
 *
 * @param tagName The name of the tag to be removed from the filter content.
 * @param filterContent An array of strings, each representing a line of filter content.
 *
 * @returns A new array of filter content with the specified tag removed.
 * If the tag is not found, the original array is returned unmodified.
 */
export const removeTag = (
    tagName: string,
    filterContent: string[],
): string[] => {
    // Make copy
    const updatedFile = filterContent.slice();

    const tagIdx = updatedFile.findIndex((line) => line.includes(tagName));

    if (tagIdx >= 0) {
        updatedFile.splice(tagIdx, 1);
    }

    return updatedFile;
};

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
export const findAndUpdateTag = (
    tagName: string,
    tagValue: string,
    filterContent: string[],
): string[] => {
    // Make copy
    const updatedFile = filterContent.slice();
    const updatedTag = createTag(tagName, tagValue);

    if (parseTag(tagName, updatedFile)) {
        const tagIdx = updatedFile.findIndex((line) => line.includes(tagName));
        updatedFile[tagIdx] = updatedTag;
    } else {
        updatedFile.unshift(updatedTag);
    }

    return updatedFile;
};
