import { isPatchValid } from '../src/diff-builder/build';
import { FILTER_3_V_1_0_0, FILTER_3_V_1_0_1, PATCH_3_1_0_0 } from './stubs/name';
import {
    FILE_1, FILE_2, FILE_1_2_PATCH,
    FILE_3, FILE_4, FILE_3_4_PATCH,
    FILE_5, FILE_6, FILE_5_6_PATCH,
    FILE_7, FILE_8, FILE_7_8_PATCH,
} from './stubs/random-files';
import { FILTER_1_V_1_0_0, FILTER_1_V_1_0_1, PATCH_1_1_0_0 } from './stubs/simple';
import { FILTER_2_V_1_0_0, FILTER_2_V_1_0_1, PATCH_2_1_0_0 } from './stubs/validation';

describe('isPatchValid', () => {
    const cases = [
        [FILTER_1_V_1_0_0, FILTER_1_V_1_0_1, PATCH_1_1_0_0],
        [FILTER_2_V_1_0_0, FILTER_2_V_1_0_1, PATCH_2_1_0_0],
        [FILTER_3_V_1_0_0, FILTER_3_V_1_0_1, PATCH_3_1_0_0],
        [FILE_1, FILE_2, FILE_1_2_PATCH],
        [FILE_3, FILE_4, FILE_3_4_PATCH],
        [FILE_5, FILE_6, FILE_5_6_PATCH],
        [FILE_7, FILE_8, FILE_7_8_PATCH],
    ];

    it.each(cases)('isPatchValid: "%s"', (
        oldFilter,
        newFilter,
        patch,
    ) => {
        const res = isPatchValid(
            oldFilter,
            newFilter,
            patch,
        );

        expect(res).toBeTruthy();
    });
});
