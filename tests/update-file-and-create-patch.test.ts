import { updateFileAndCreatePatch } from '../src/diff-builder/build';
import { files } from './stubs/update-file-and-create-patch';

describe('checks updateFileAndCreatePatch', () => {
    it.each(files)('', async (
        oldFilter,
        newFilter,
        expectedPatch,
        newFilterWithUpdatedTags,
    ) => {
        const {
            newFileWithUpdatedTags,
            patch,
        } = await updateFileAndCreatePatch(
            oldFilter,
            newFilter,
            false,
            'path-to-patches/',
            'new-patch-1.patch',
            '',
        );

        expect(patch).toStrictEqual(expectedPatch);
        expect(newFilterWithUpdatedTags).toStrictEqual(newFileWithUpdatedTags);
    });
});
