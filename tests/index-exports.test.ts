import { applyRcsPatch, validatePatch } from '../src/diff-builder';

describe('public exports', () => {
    it('exports patch application helpers', () => {
        expect(typeof applyRcsPatch).toBe('function');
        expect(typeof validatePatch).toBe('function');
    });
});
