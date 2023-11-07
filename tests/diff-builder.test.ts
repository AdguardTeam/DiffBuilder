import {
    TypesOfChanges,
    detectTypeOfChanges,
    createPatch,
    createDiffDirective,
    calculateChecksum,
    parseTag,
    findAndUpdateTag,
} from '../diff-builder/build';
import {
    FILTER_2_V_1_0_0,
    FILTER_2_V_1_0_1,
    FILTER_V_1_0_0,
    FILTER_V_1_0_1,
    PATCH_1_0_0,
    PATCH_2_1_0_0,
} from './mocks';

describe('check diff-builder', () => {
    it('check detectTypeOfChanges', () => {
        let res = detectTypeOfChanges('+a');
        expect(res).toEqual(TypesOfChanges.Add);

        res = detectTypeOfChanges('-b');
        expect(res).toEqual(TypesOfChanges.Delete);
    });

    it('check calculateChecksum', () => {
        const content = PATCH_1_0_0;

        const checksum = calculateChecksum(content);

        expect(checksum).toEqual('b25df92a61db5385bff0cc75f1a4492470f8d415');
    });

    it('check parseTag', () => {
        const content = FILTER_V_1_0_0;

        const version = parseTag('Version', content.split('\n'));
        expect(version).toEqual('v1.0.0');

        const diffPath = parseTag('Diff-Path', content.split('\n'));
        expect(diffPath).toEqual('patches/v1.0.0.patch');
    });

    it('check findAndUpdateTag', () => {
        const content = FILTER_V_1_0_0;

        const filterWithUpdatedVersion = findAndUpdateTag('Version', 'v9.9.9', content.split('\n'));
        expect(filterWithUpdatedVersion.join('\n')).toEqual(content.replace('! Version: v1.0.0', '! Version: v9.9.9'));

        const filterWithUpdatedDiffPath = findAndUpdateTag('Diff-Path', 'patches/v9.9.9.patch', content.split('\n'));
        expect(filterWithUpdatedDiffPath.join('\n')).toEqual(
            content.replace('! Diff-Path: patches/v1.0.0.patch', '! Diff-Path: patches/v9.9.9.patch'),
        );

        // Check that original filter didn't changed.
        expect(content).toEqual(FILTER_V_1_0_0);
    });

    describe('check createPatch', () => {
        it('creates simple patch', () => {
            const filter1 = FILTER_V_1_0_0;
            const filter2 = FILTER_V_1_0_1;

            const patch = createPatch(filter1, filter2);

            expect(patch).toEqual(PATCH_1_0_0);
        });

        it('creates simple patch 2', () => {
            const filter1 = FILTER_2_V_1_0_0;
            const filter2 = FILTER_2_V_1_0_1;

            const patch = createPatch(filter1, filter2);

            expect(patch).toEqual(PATCH_2_1_0_0);
        });

        it('creates patch with validation', () => {
            const filter1 = FILTER_V_1_0_0;
            const filter2 = FILTER_V_1_0_1;

            let patch = createPatch(filter1, filter2);

            const diffDirective = createDiffDirective(filter1.split('\n'), patch);
            patch = diffDirective.concat('\n', patch);

            const directive = 'diff checksum:b25df92a61db5385bff0cc75f1a4492470f8d415 lines:5';

            expect(patch).toEqual(directive.concat('\n').concat(PATCH_1_0_0));
        });
    });
});
