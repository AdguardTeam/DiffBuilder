/**
 * Finds value of specified header tag in filter rules text.
 *
 * @param tagName Filter header tag name.
 * @param rules Lines of filter rules text.
 *
 * @returns Value of specified header tag or null if tag not found.
 */
export const parseTag = (tagName: string, rules: string[]): string | null => {
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
