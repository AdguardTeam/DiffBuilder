import { type ApplyPatchParams } from './update';
declare const DiffUpdater: {
    applyPatch: (params: ApplyPatchParams) => Promise<string | null>;
};
export { DiffUpdater, type ApplyPatchParams, };
