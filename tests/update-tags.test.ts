import { splitByLines } from '../src/common/split-by-lines';
import { updateTags } from '../src/diff-builder/build';
import {
    FILTER_CHECKSUM_1_V_1_0_0,
    FILTER_CHECKSUM_1_V_1_0_1,
    FILTER_CHECKSUM_2_V_1_0_0,
    FILTER_CHECKSUM_2_V_1_0_1,
    FILTER_CHECKSUM_3_V_1_0_0,
    FILTER_CHECKSUM_3_V_1_0_1,
    FILTER_CHECKSUM_4_V_1_0_0,
    FILTER_CHECKSUM_4_V_1_0_1,
} from './stubs/filters-with-checksum';

describe('check updateTags', () => {
    const cases = [
        /* eslint-disable max-len */
        ['checks case when Diff-Path placed NOT on the first line after Checksum tag', FILTER_CHECKSUM_1_V_1_0_0, FILTER_CHECKSUM_1_V_1_0_1],
        ['checks case when Diff-Path placed on the first line after Checksum tag', FILTER_CHECKSUM_2_V_1_0_0, FILTER_CHECKSUM_2_V_1_0_1],
        ['checks case when there are two checksums in file', FILTER_CHECKSUM_3_V_1_0_0, FILTER_CHECKSUM_3_V_1_0_1],
        ['checks case when there is agent header in file', FILTER_CHECKSUM_4_V_1_0_0, FILTER_CHECKSUM_4_V_1_0_1],
        /* eslint-enable max-len */
    ];

    it.each(cases)('%s', (_, filter1, filter2) => {
        // Checksum should be on the first line
        const originFirstLine = splitByLines(filter1)[0];

        // Emulate changes
        const updatedFilter1 = filter1
            .replace('! Diff-Path: ../included_filter_patch.patch', '! Diff-Path: ../included_filter_patch_2.patch')
            .replace('Version: v1.0.0', 'Version: v1.0.1')
            .replace('example.org', 'example.com');

        const updatedFilter1WithTags = updateTags(
            updatedFilter1,
            '../patches/1/1-m-28378192-60.patch',
        );

        expect(updatedFilter1WithTags).toStrictEqual(filter2);

        const firstLine = splitByLines(updatedFilter1WithTags)[0];
        const lineEnding = originFirstLine.endsWith('\r\n') ? '\r\n' : '\n';
        expect(firstLine.endsWith(lineEnding)).toBe(true);
    });
});
