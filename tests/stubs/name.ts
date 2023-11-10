import { MOCK_DATE_NOW_MS } from '../mocks';

export const FILTER_3_V_1_0_0 = `! Title: Batch-Updatable List 1
! Diff-Path: ../patches/batch_v1.0.0.patch#list1
||example.org^
`;

export const FILTER_3_V_1_0_1 = `! Title: Batch-Updatable List 1
! Diff-Path: ../patches/batch_v1.0.1.patch#list1
||example.com^
`;

export const PATCH_3_1_0_0 = `d2 2
a3 2
! Diff-Path: ../patches/batch_v1.0.1.patch#list1
||example.com^`;

// eslint-disable-next-line max-len
export const FILTER_3_V_1_0_1_DIFF_DIRECTIVE = `diff name:list1 checksum:5b8abcb6763972f65970a036ee3551818c43499d lines:4 timestamp:${MOCK_DATE_NOW_MS}`;
