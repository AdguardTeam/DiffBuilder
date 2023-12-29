import { extractBaseUrl } from '../src/diff-updater/update';

describe('check extractBaseUrl', () => {
    const cases = [
        ['C:\\Users\\alexx\\Downloads\\test-custom\\filter.txt', 'C:\\Users\\alexx\\Downloads\\test-custom'],
        ['https://filters.adtidy.org/extension/ublock/filters/2.txt', 'https://filters.adtidy.org/extension/ublock/filters'],
        ['test-data/filters/2.txt', 'test-data/filters'],
    ];

    it.each(cases)('extractBaseUrl(%s) should return %s', (input, expected) => {
        expect(extractBaseUrl(input)).toBe(expected);
    });
});
