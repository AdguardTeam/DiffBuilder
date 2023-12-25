import { updateFileAndCreatePatch } from '../src/diff-builder/build';
import {
    LARGE_FILTER_OLD,
    LARGE_FILTER_NEW,
    LARGE_FILTER_PATCH,
    LARGE_FILTER_NEW_WITH_UPDATED_TAGS,
} from './stubs/large-filter';
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

    it('do not change (except Diff-Path and Checksum tags) new filter when creating patches', async () => {
        const filter1 = LARGE_FILTER_OLD;
        const filter2 = LARGE_FILTER_NEW;

        const {
            newFileWithUpdatedTags,
            patch,
        } = await updateFileAndCreatePatch(
            filter1,
            filter2,
            false,
            '../patches/1',
            '/1-m-28378192-60.patch',
            null,
        );
        expect(newFileWithUpdatedTags).toEqual(LARGE_FILTER_NEW_WITH_UPDATED_TAGS);
        expect(patch).toEqual(LARGE_FILTER_PATCH);
    });
});
