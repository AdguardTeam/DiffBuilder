import { MOCK_DATE_NOW_MS } from '../mocks';

export const FILTER_1_V_1_0_0 = `! Title: Diff Updates Simple Example List
! Version: v1.0.0
! Diff-Path: patches/v1.0.0.patch
||example.org^
`;

export const FILTER_1_V_1_0_1 = `! Title: Diff Updates Simple Example List
! Version: v1.0.1
! Diff-Path: patches/v1.0.1.patch
||example.com^
`;

export const PATCH_1_1_0_0 = `d2 3
a4 3
! Version: v1.0.1
! Diff-Path: patches/v1.0.1.patch
||example.com^`;

// eslint-disable-next-line max-len
export const FILTER_1_V_1_0_1_DIFF_DIRECTIVE = `diff checksum:792ae6af57d3683cc5d81c045a20ea633171b8c0 lines:4 timestamp:${MOCK_DATE_NOW_MS}`;
