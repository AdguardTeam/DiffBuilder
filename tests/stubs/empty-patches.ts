export const EMPTY_PATCH_1 = `d1 1
a1 1
! Checksum: psdahfajsh
d4 1
a4 1
! Diff-Path: ../patches/1/1-m-28378192-60.patch`;

export const EMPTY_PATCH_2 = `d1 2
a2 2
! Checksum: psdahfajsh
! Diff-Path: ../patches/1/1-m-28378192-60.patch`;

export const NOT_EMPTY_PATCH_1 = `d1 1
a1 1
! Checksum: psdahfajsh
d3 3
a5 3
! Version: v1.0.1
! Diff-Path: ../patches/1/1-m-28378192-60.patch
||example.com^`;

export const NOT_EMPTY_PATCH_2 = `d1 2
a2 2
! Checksum: psdahfajsh
! Diff-Path: ../patches/1/1-m-28378192-60.patch
d4 2
a5 2
! Version: v1.0.1
||example.com^`;
