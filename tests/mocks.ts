export const FILTER_V_1_0_0 = `! Title: Diff Updates Simple Example List
! Version: v1.0.0
! Diff-Path: patches/v1.0.0.patch
||example.org^`;

export const FILTER_V_1_0_1 = `! Title: Diff Updates Simple Example List
! Version: v1.0.1
! Diff-Path: patches/v1.0.1.patch
||example.com^`;

export const PATCH_1_0_0 = `d2 3
a4 3
! Version: v1.0.1
! Diff-Path: patches/v1.0.1.patch
||example.com^`;

export const FILTER_2_V_1_0_0 = `! Diff-Path: v1.0.0.patch
! Title: Diff Updates Simple Example List
! Version: v1.0.0
||example.org^
`;

export const FILTER_2_V_1_0_1 = `! Diff-Path: v1.0.1.patch
! Title: Diff Updates Simple Example List
! Version: v1.0.1
||example.com^
`;

export const PATCH_2_1_0_0 = `d1 1
a1 1
! Diff-Path: v1.0.1.patch
d3 2
a4 2
! Version: v1.0.1
||example.com^`;
