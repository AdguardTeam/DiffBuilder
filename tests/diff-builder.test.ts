import { calculateChecksum } from '../common/calculate-checksum';
import { createDiffDirective } from '../common/diff-directive';
import { parseTag } from '../common/parse-tag';
import { TypesOfChanges } from '../common/types-of-change';
import {
    detectTypeOfChanges,
    createPatch,
    findAndUpdateTag,
} from '../diff-builder/build';
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
} from './stubs/random-files';
import { FILTER_1_V_1_0_0, FILTER_1_V_1_0_1, PATCH_1_1_0_0 } from './stubs/simple';
import { FILTER_2_V_1_0_0, FILTER_2_V_1_0_1, PATCH_2_1_0_0 } from './stubs/validation';
import { FILTER_3_V_1_0_0, FILTER_3_V_1_0_1, PATCH_3_1_0_0 } from './stubs/name';
import { MOCK_DATE_NOW_MS } from './mocks';

describe('check diff-builder', () => {
    Date.now = jest.fn(() => MOCK_DATE_NOW_MS);

    it('check detectTypeOfChanges', () => {
        let res = detectTypeOfChanges('+a');
        expect(res).toEqual(TypesOfChanges.Add);

        res = detectTypeOfChanges('-b');
        expect(res).toEqual(TypesOfChanges.Delete);
    });

    it('check calculateChecksum', () => {
        const content = FILTER_1_V_1_0_1;

        const checksum = calculateChecksum(content);

        expect(checksum).toEqual('792ae6af57d3683cc5d81c045a20ea633171b8c0');
    });

    it('check parseTag', () => {
        const content = FILTER_1_V_1_0_0;

        const version = parseTag('Version', content.split('\n'));
        expect(version).toEqual('v1.0.0');

        const diffPath = parseTag('Diff-Path', content.split('\n'));
        expect(diffPath).toEqual('patches/v1.0.0.patch');
    });

    it('check findAndUpdateTag', () => {
        const content = FILTER_1_V_1_0_0;

        const filterWithUpdatedVersion = findAndUpdateTag('Version', 'v9.9.9', content.split('\n'));
        expect(filterWithUpdatedVersion.join('\n')).toEqual(content.replace('! Version: v1.0.0', '! Version: v9.9.9'));

        const filterWithUpdatedDiffPath = findAndUpdateTag('Diff-Path', 'patches/v9.9.9.patch', content.split('\n'));
        expect(filterWithUpdatedDiffPath.join('\n')).toEqual(
            content.replace('! Diff-Path: patches/v1.0.0.patch', '! Diff-Path: patches/v9.9.9.patch'),
        );

        // Check that original filter didn't changed.
        expect(content).toEqual(FILTER_1_V_1_0_0);
    });

    describe('check createPatch', () => {
        const cases = [
            [FILTER_1_V_1_0_0, FILTER_1_V_1_0_1, PATCH_1_1_0_0],
            [FILTER_2_V_1_0_0, FILTER_2_V_1_0_1, PATCH_2_1_0_0],
            [FILTER_3_V_1_0_0, FILTER_3_V_1_0_1, PATCH_3_1_0_0],
            [FILE_1, FILE_2, FILE_1_2_PATCH],
            [FILE_3, FILE_4, FILE_3_4_PATCH],
            [FILE_5, FILE_6, FILE_5_6_PATCH],
            [FILE_7, FILE_8, FILE_7_8_PATCH],
        ];

        it.each(cases)('creates patch', (
            filter1,
            filter2,
            expectedPatch,
        ) => {
            const patch = createPatch(filter1, filter2);

            expect(patch).toEqual(expectedPatch);
        });

        it('creates patch with validation', () => {
            const filter1 = FILTER_1_V_1_0_0;
            const filter2 = FILTER_1_V_1_0_1;

            let patch = createPatch(filter1, filter2);

            const diffDirective = createDiffDirective(filter1.split('\n'), filter2, patch);
            patch = diffDirective.concat('\n', patch);

            // eslint-disable-next-line max-len
            const directive = `diff checksum:792ae6af57d3683cc5d81c045a20ea633171b8c0 lines:4 timestamp:${MOCK_DATE_NOW_MS}`;

            expect(patch).toEqual(directive.concat('\n').concat(PATCH_1_1_0_0));
        });
    });
});
