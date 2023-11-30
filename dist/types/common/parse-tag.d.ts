/**
 * Finds value of specified header tag in filter rules text.
 *
 * @param tagName Filter header tag name.
 * @param rules Lines of filter rules text.
 *
 * @returns Value of specified header tag or null if tag not found.
 */
export declare const parseTag: (tagName: string, rules: string[]) => string | null;
