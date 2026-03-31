import { expectNotType } from 'tsd';

import { DiffBuilder, PATCH_EXTENSION } from '@adguard/diff-builder';
import { DiffUpdater, UnacceptableResponseError } from '@adguard/diff-builder/diff-updater';

// Verify that key exports are not typed as 'any'
expectNotType<any>(DiffBuilder);
expectNotType<any>(DiffBuilder.buildDiff);
expectNotType<any>(PATCH_EXTENSION);

expectNotType<any>(DiffUpdater);
expectNotType<any>(DiffUpdater.applyPatch);
expectNotType<any>(UnacceptableResponseError);
