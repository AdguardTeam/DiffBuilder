// Root export path: '.'
import {
    DiffBuilder,
    PATCH_EXTENSION,
    type BuildDiffParams,
} from '@adguard/diff-builder';

// ESM export path: './es'
import {
    DiffBuilder as DiffBuilderEs,
    PATCH_EXTENSION as PatchExtensionEs,
    type BuildDiffParams as BuildDiffParamsEs,
} from '@adguard/diff-builder/es';

// Sub-path export: './diff-updater'
import {
    DiffUpdater,
    UnacceptableResponseError,
    type ApplyPatchParams,
} from '@adguard/diff-builder/diff-updater';

// ESM sub-path export: './diff-updater/es'
import {
    DiffUpdater as DiffUpdaterEs,
    UnacceptableResponseError as UnacceptableResponseErrorEs,
    type ApplyPatchParams as ApplyPatchParamsEs,
} from '@adguard/diff-builder/diff-updater/es';

// Verify runtime values exist (type-level only, not executed)
const _builder: typeof DiffBuilder = DiffBuilder;
const _builderEs: typeof DiffBuilderEs = DiffBuilderEs;
const _updater: typeof DiffUpdater = DiffUpdater;
const _updaterEs: typeof DiffUpdaterEs = DiffUpdaterEs;
const _ext: string = PATCH_EXTENSION;
const _extEs: string = PatchExtensionEs;
const _err: typeof UnacceptableResponseError = UnacceptableResponseError;
const _errEs: typeof UnacceptableResponseErrorEs = UnacceptableResponseErrorEs;

// Verify type aliases are usable
type _BuildParams = BuildDiffParams;
type _BuildParamsEs = BuildDiffParamsEs;
type _ApplyParams = ApplyPatchParams;
type _ApplyParamsEs = ApplyPatchParamsEs;

console.log('TypeScript smoke test passed.');
