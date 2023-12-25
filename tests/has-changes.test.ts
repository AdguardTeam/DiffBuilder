import { hasChanges } from '../src/diff-builder/build';
import { sameFiles } from './stubs/parse-tags-and-check-changes/same-files';
import { differentFiles } from './stubs/parse-tags-and-check-changes/different-files';

describe('check hasChanges', () => {
    describe('check that files do not changed', () => {
        const cases = sameFiles;

        it.each(cases)('%s', (_, oldFilter, newFilter) => {
            expect(hasChanges(oldFilter, newFilter)).toBeFalsy();
        });
    });

    describe('check that files are different', () => {
        const cases = differentFiles;

        it.each(cases)('%s', (_, oldFilter, newFilter) => {
            expect(hasChanges(oldFilter, newFilter)).toBeTruthy();
        });
    });
});
