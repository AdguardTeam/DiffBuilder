import { parseDiffDirective } from '../common/diff-directive';
import { applyRcsPatch } from '../diff-updater/update';
import {
    FILE_1,
    FILE_1_2_PATCH,
    FILE_2,
    FILE_2_DIFF_DIRECTIVE,
    FILE_3,
    FILE_3_4_PATCH,
    FILE_4,
    FILE_4_DIFF_DIRECTIVE,
    FILE_5,
    FILE_5_6_PATCH,
    FILE_6,
    FILE_6_DIFF_DIRECTIVE,
    FILE_7,
    FILE_7_8_PATCH,
    FILE_8,
    FILE_8_DIFF_DIRECTIVE,
    FILTER_2_V_1_0_0,
    FILTER_2_V_1_0_1,
    FILTER_2_V_1_0_1_DIFF_DIRECTIVE,
    FILTER_V_1_0_0,
    FILTER_V_1_0_1,
    FILTER_V_1_0_1_DIFF_DIRECTIVE,
    PATCH_1_0_0,
    PATCH_2_1_0_0,
} from './stubs';

describe('check diff-updater', () => {
    const jestConsole = console;

    beforeEach(() => {
        // eslint-disable-next-line global-require
        global.console = require('console');
    });

    afterEach(() => {
        global.console = jestConsole;
    });

    const cases = [
        [FILTER_V_1_0_0, FILTER_V_1_0_1, PATCH_1_0_0, FILTER_V_1_0_1_DIFF_DIRECTIVE],
        [FILTER_2_V_1_0_0, FILTER_2_V_1_0_1, PATCH_2_1_0_0, FILTER_2_V_1_0_1_DIFF_DIRECTIVE],
        [FILE_1, FILE_2, FILE_1_2_PATCH, FILE_2_DIFF_DIRECTIVE],
        [FILE_3, FILE_4, FILE_3_4_PATCH, FILE_4_DIFF_DIRECTIVE],
        [FILE_5, FILE_6, FILE_5_6_PATCH, FILE_6_DIFF_DIRECTIVE],
        [FILE_7, FILE_8, FILE_7_8_PATCH, FILE_8_DIFF_DIRECTIVE],
    ];

    it.each(cases)('apply rcs patch', (
        oldFilter,
        newFilter,
        patch,
        diffDirective,
    ) => {
        let updatedFilter = applyRcsPatch(
            oldFilter.split(/\r?\n/),
            patch.split(/\r?\n/),
            oldFilter.endsWith('\r\n') ? '\r\n' : '\n',
        );

        expect(updatedFilter).toBe(newFilter);

        const parsedDiffDirective = parseDiffDirective(diffDirective);
        updatedFilter = applyRcsPatch(
            oldFilter.split(/\r?\n/),
            patch.split(/\r?\n/),
            oldFilter.endsWith('\r\n') ? '\r\n' : '\n',
            parsedDiffDirective ? parsedDiffDirective.checksum : undefined,
        );

        expect(updatedFilter).toBe(newFilter);
    });
});
