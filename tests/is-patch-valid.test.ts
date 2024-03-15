import { isPatchValid } from '../src/diff-builder/build';
import {
    FILE_1,
    FILE_2,
    FILE_1_2_PATCH,
    FILE_3,
    FILE_4,
    FILE_3_4_PATCH,
    FILE_5_6_PATCH,
    FILE_5,
    FILE_6,
    FILE_7,
    FILE_7_8_PATCH,
    FILE_8,
    FILE_2_DIFF_DIRECTIVE,
    FILE_4_DIFF_DIRECTIVE,
    FILE_6_DIFF_DIRECTIVE,
    FILE_8_DIFF_DIRECTIVE,
} from './stubs/random-files';
import {
    FILTER_1_V_1_0_0,
    FILTER_1_V_1_0_1,
    FILTER_1_V_1_0_1_DIFF_DIRECTIVE,
    PATCH_1_1_0_0,
} from './stubs/simple';
import {
    FILTER_2_V_1_0_0,
    FILTER_2_V_1_0_1,
    FILTER_2_V_1_0_1_DIFF_DIRECTIVE,
    PATCH_2_1_0_0,
} from './stubs/validation';
import {
    FILTER_3_V_1_0_0,
    FILTER_3_V_1_0_1,
    FILTER_3_V_1_0_1_DIFF_DIRECTIVE,
    PATCH_3_1_0_0,
} from './stubs/name';
import {
    FILTER_CHECKSUM_1_V_1_0_0,
    FILTER_CHECKSUM_1_V_1_0_1,
    FILTER_CHECKSUM_1_V_1_0_1_DIFF_DIRECTIVE,
    PATCH_CHECKSUM_1_1_0_0,
} from './stubs/filters-with-checksum';
import {
    OLD_FILTER_WITH_PREFIX,
    NEW_FILTER_WITH_PREFIX,
    FILTER_WITH_PREFIX_PATCH_AND_CHECKSUM,
} from './stubs/valid-patches/filters-with-prefixes';

describe('check is patch valid', () => {
    describe('check validity of created patch with diff directive', () => {
        const cases = [
            [FILTER_1_V_1_0_0, FILTER_1_V_1_0_1, PATCH_1_1_0_0, FILTER_1_V_1_0_1_DIFF_DIRECTIVE],
            [FILTER_2_V_1_0_0, FILTER_2_V_1_0_1, PATCH_2_1_0_0, FILTER_2_V_1_0_1_DIFF_DIRECTIVE],
            [FILTER_3_V_1_0_0, FILTER_3_V_1_0_1, PATCH_3_1_0_0, FILTER_3_V_1_0_1_DIFF_DIRECTIVE],
            [FILE_1, FILE_2, FILE_1_2_PATCH, FILE_2_DIFF_DIRECTIVE],
            [FILE_3, FILE_4, FILE_3_4_PATCH, FILE_4_DIFF_DIRECTIVE],
            [FILE_5, FILE_6, FILE_5_6_PATCH, FILE_6_DIFF_DIRECTIVE],
            [FILE_7, FILE_8, FILE_7_8_PATCH, FILE_8_DIFF_DIRECTIVE],
            // eslint-disable-next-line max-len
            [FILTER_CHECKSUM_1_V_1_0_0, FILTER_CHECKSUM_1_V_1_0_1, PATCH_CHECKSUM_1_1_0_0, FILTER_CHECKSUM_1_V_1_0_1_DIFF_DIRECTIVE],
        ];

        it.each(cases)('checks patch without diff directive', (
            filter1,
            filter2,
            patch,
        ) => {
            expect(isPatchValid(filter1, filter2, patch)).toBeTruthy();
        });

        it.each(cases)('checks patch with diff directive', (
            filter1,
            filter2,
            patch,
            diffDirective,
        ) => {
            expect(isPatchValid(filter1, filter2, diffDirective.concat(...['\n', patch]))).toBeTruthy();
        });
    });

    describe('check validity of created patch with diff directive', () => {
        const cases = [
            [OLD_FILTER_WITH_PREFIX, NEW_FILTER_WITH_PREFIX, FILTER_WITH_PREFIX_PATCH_AND_CHECKSUM],
        ];

        it.each(cases)('checks patch', (
            filter1,
            filter2,
            patch,
        ) => {
            expect(isPatchValid(filter1, filter2, patch)).toBeTruthy();
        });
    });
});
