import { type BuildDiffParams } from './build';
declare const DiffBuilder: {
    buildDiff: (params: BuildDiffParams) => Promise<void>;
};
export { type BuildDiffParams, DiffBuilder, };
