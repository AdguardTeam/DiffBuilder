const { ok, strictEqual } = require('assert');

// Test root export path: '.'
const { DiffBuilder, PATCH_EXTENSION } = require('@adguard/diff-builder');

ok(DiffBuilder !== null && typeof DiffBuilder === 'object', 'DiffBuilder should be an object');
strictEqual(typeof DiffBuilder.buildDiff, 'function', 'DiffBuilder.buildDiff should be a function');
strictEqual(typeof PATCH_EXTENSION, 'string', 'PATCH_EXTENSION should be a string');

// Test sub-path export: './diff-updater'
const { DiffUpdater, UnacceptableResponseError } = require('@adguard/diff-builder/diff-updater');

ok(DiffUpdater !== null && typeof DiffUpdater === 'object', 'DiffUpdater should be an object');
strictEqual(typeof DiffUpdater.applyPatch, 'function', 'DiffUpdater.applyPatch should be a function');
strictEqual(typeof UnacceptableResponseError, 'function', 'UnacceptableResponseError should be a constructor');

console.log('CJS smoke test passed.');
