import { ok, strictEqual } from 'assert';

// Test root export path: '.'
import { DiffBuilder, PATCH_EXTENSION } from '@adguard/diff-builder';

ok(DiffBuilder !== null && typeof DiffBuilder === 'object', 'DiffBuilder should be an object');
strictEqual(typeof DiffBuilder.buildDiff, 'function', 'DiffBuilder.buildDiff should be a function');
strictEqual(typeof PATCH_EXTENSION, 'string', 'PATCH_EXTENSION should be a string');

// Test ESM export path: './es'
import { DiffBuilder as DiffBuilderEs, PATCH_EXTENSION as PATCH_EXTENSION_ES } from '@adguard/diff-builder/es';

ok(DiffBuilderEs !== null && typeof DiffBuilderEs === 'object', 'DiffBuilder (es) should be an object');
strictEqual(typeof DiffBuilderEs.buildDiff, 'function', 'DiffBuilder.buildDiff (es) should be a function');
strictEqual(typeof PATCH_EXTENSION_ES, 'string', 'PATCH_EXTENSION (es) should be a string');

// Test sub-path export: './diff-updater'
import { DiffUpdater, UnacceptableResponseError } from '@adguard/diff-builder/diff-updater';

ok(DiffUpdater !== null && typeof DiffUpdater === 'object', 'DiffUpdater should be an object');
strictEqual(typeof DiffUpdater.applyPatch, 'function', 'DiffUpdater.applyPatch should be a function');
strictEqual(typeof UnacceptableResponseError, 'function', 'UnacceptableResponseError should be a constructor');

// Test ESM sub-path export: './diff-updater/es'
import { DiffUpdater as DiffUpdaterEs, UnacceptableResponseError as UnacceptableResponseErrorEs } from '@adguard/diff-builder/diff-updater/es';

ok(DiffUpdaterEs !== null && typeof DiffUpdaterEs === 'object', 'DiffUpdater (es) should be an object');
strictEqual(typeof DiffUpdaterEs.applyPatch, 'function', 'DiffUpdater.applyPatch (es) should be a function');
strictEqual(typeof UnacceptableResponseErrorEs, 'function', 'UnacceptableResponseError (es) should be a constructor');

console.log('ESM smoke test passed.');
