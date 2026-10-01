import {
    buildDiff,
    validatePatch,
    type BuildDiffParams,
    PATCH_EXTENSION,
} from './build';
import { applyRcsPatch } from '../diff-updater/update';

const DiffBuilder = {
    buildDiff,
};

export {
    DiffBuilder,
    applyRcsPatch,
    validatePatch,
    type BuildDiffParams,
    PATCH_EXTENSION,
};
