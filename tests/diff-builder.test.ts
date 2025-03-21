import { calculateChecksumSHA1 } from '../src/common/calculate-checksum';
import { createDiffDirective } from '../src/common/diff-directive';
import {
    createPatch,
} from '../src/diff-builder/build';
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
import { FILTER_WITHOUT_EMPTY_LINE, FILTER_WITH_EMPTY_LINE, FILTER_WITH_SEVERAL_EMPTY_LINES } from './stubs/new-lines';
import { splitByLines } from '../src/common/split-by-lines';
import { parseTag } from '../src/diff-builder/tags';
import {
    FILTER_CHECKSUM_1_V_1_0_0,
    FILTER_CHECKSUM_1_V_1_0_1,
    PATCH_CHECKSUM_1_1_0_0,
    FILTER_CHECKSUM_1_V_1_0_1_DIFF_DIRECTIVE,
} from './stubs/filters-with-checksum';

describe('check diff-builder', () => {
    it('check calculateChecksum', () => {
        const content = FILTER_1_V_1_0_1;

        const checksum = calculateChecksumSHA1(content);

        expect(checksum).toEqual('17fbb4b268e4d176fbd75fd627ba2e84b945e077');
    });

    it('check parseTag', () => {
        const content = FILTER_1_V_1_0_0;

        const version = parseTag('Version', splitByLines(content));
        expect(version).toEqual('v1.0.0');
        expect(version!.endsWith('\n')).toBeFalsy();
        expect(version!.endsWith('\r\n')).toBeFalsy();

        const diffPath = parseTag('Diff-Path', splitByLines(content));
        expect(diffPath).toEqual('../patches/1/1-m-28378132-60.patch');
        expect(diffPath!.endsWith('\n')).toBeFalsy();
        expect(diffPath!.endsWith('\r\n')).toBeFalsy();
    });

    it('check splitByLines', () => {
        let splitted = splitByLines(FILTER_WITH_EMPTY_LINE);
        expect(splitted.length).toBe(2);
        expect(splitted[splitted.length - 1].endsWith('\n')).toBeTruthy();

        splitted = splitByLines(FILTER_WITHOUT_EMPTY_LINE);
        expect(splitted.length).toBe(2);
        expect(splitted[splitted.length - 1].endsWith('\n')).toBeFalsy();

        splitted = splitByLines(FILTER_WITH_SEVERAL_EMPTY_LINES);
        expect(splitted.length).toBe(3);
        expect(splitted[splitted.length - 1].endsWith('\n')).toBeTruthy();
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

        it.each(cases)('creates patch', async (
            filter1,
            filter2,
            expectedPatch,
        ) => {
            const patch = await createPatch(filter1, filter2);

            expect(patch).toStrictEqual(expectedPatch);
        });

        it('creates patch with validation', async () => {
            const filter1 = FILTER_1_V_1_0_0;
            const filter2 = FILTER_1_V_1_0_1;

            let patch = await createPatch(filter1, filter2);

            const oldFileDiffPath = parseTag('Diff-Path', splitByLines(filter1));

            const diffDirective = createDiffDirective(oldFileDiffPath, filter2, patch);
            patch = diffDirective.concat('\n', patch);

            const directive = 'diff checksum:17fbb4b268e4d176fbd75fd627ba2e84b945e077 lines:4';

            expect(patch).toEqual(directive.concat('\n').concat(PATCH_1_1_0_0));
        });

        it('creates patch with correct checksums changes', async () => {
            const filter1 = FILTER_CHECKSUM_1_V_1_0_0;
            const filter2 = FILTER_CHECKSUM_1_V_1_0_1;

            const patch = await createPatch(filter1, filter2);
            expect(patch).toEqual(PATCH_CHECKSUM_1_1_0_0);

            const oldFileDiffPath = parseTag('Diff-Path', splitByLines(filter1));

            const diffDirective = createDiffDirective(oldFileDiffPath, filter2, patch);
            expect(diffDirective).toEqual(FILTER_CHECKSUM_1_V_1_0_1_DIFF_DIRECTIVE);
        });
    });
});
