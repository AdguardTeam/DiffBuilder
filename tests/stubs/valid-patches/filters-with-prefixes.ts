export const OLD_FILTER_WITH_PREFIX = `![Adblock Plus 2.0]
! Diff-Path: patches/ttt-475120-1.patch
! Title: Diff Updates Simple Example List
! Version: v1.0.0
||example.org^`;

export const NEW_FILTER_WITH_PREFIX = `![Adblock Plus 2.0]
! Diff-Path: patches/ttt-475123-1.patch
! Title: Diff Updates Simple Example List
! Version: v1.0.1
||example.com^`;

export const FILTER_WITH_PREFIX_PATCH_AND_CHECKSUM = `diff checksum:978e508171b20339cdf8b3d216b8abced3a76658 lines:6
d2 1
a2 1
! Diff-Path: patches/ttt-475123-1.patch
d4 2
a5 2
! Version: v1.0.1
||example.com^`;
