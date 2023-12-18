import { DIFF_PATH_TAG } from '../src/common/constants';
import { parseTag } from '../src/common/parse-tag';
import { splitByLines } from '../src/common/split-by-lines';
import {
    EXAMPLE_DIFF_PATH_TAG,
    FILTER_1,
    FILTER_2,
    FILTER_3_TWO_TAGS,
} from './stubs/filters-with-tags';

describe('check parseTag', () => {
    const cases = [
        FILTER_1,
        FILTER_2,
        FILTER_3_TWO_TAGS,
    ];

    it.each(cases)('%s', (filterContent) => {
        const tag = parseTag(DIFF_PATH_TAG, splitByLines(filterContent));

        const TAG_DELIMITER = ': ';
        // eslint-disable-next-line max-len
        const expectedTag = EXAMPLE_DIFF_PATH_TAG.slice(
            EXAMPLE_DIFF_PATH_TAG.indexOf(DIFF_PATH_TAG) + DIFF_PATH_TAG.length + TAG_DELIMITER.length,
        );
        expect(tag).toStrictEqual(expectedTag);
    });
});
