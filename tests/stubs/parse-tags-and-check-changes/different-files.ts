export const FILTER_1_OLD = `! Checksum: G3J40YYEG72sOhSMJlicgw
! Title: Same file
! Version: v1.0.0
! Diff-Path: ../patches/1/1-m-28378132-60.patch
||example.org^`;
export const FILTER_1_NEW = `! Checksum: iP3cfJ4iR+MPqRJUsy8cWw
! Title: Same file
! Version: v1.0.1
! Diff-Path: ../patches/1/1-m-28378192-60.patch
||example.com^`;

export const FILTER_2_OLD = `! Checksum: G3J40YYEG72sOhSMJlicgw
! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_2_NEW = `! Checksum: iP3cfJ4iR+MPqRJUsy8cWw
! Diff-Path: ../patches/1/1-m-28378192-60.patch
! Title: Same file
! Version: v1.0.1
||example.com^`;

export const FILTER_3_OLD = `! Checksum: G3J40YYEG72sOhSMJlicgw
! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_3_NEW = `! Checksum: iP3cfJ4iR+MPqRJUsy8cWw
! Title: Same file
! Version: v1.0.1
! Diff-Path: ../patches/1/1-m-28378192-60.patch
||example.com^`;

export const FILTER_4_OLD = `! Checksum: G3J40YYEG72sOhSMJlicgw
! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_4_NEW = `! Checksum: iP3cfJ4iR+MPqRJUsy8cWw
! Title: Same file
! Version: v1.0.1
! Diff-Path: ../patches/1/1-m-28378192-60.patch
||example.com^`;

export const FILTER_5_OLD = `! Checksum: G3J40YYEG72sOhSMJlicgw
! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_5_NEW = `! Checksum: iP3cfJ4iR+MPqRJUsy8cWw
! Title: Same file
! Version: v1.0.1
||example.com^`;

export const FILTER_6_OLD = `! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_6_NEW = `! Checksum: iP3cfJ4iR+MPqRJUsy8cWw
! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.1
||example.com^`;

export const FILTER_7_OLD = `! Checksum: G3J40YYEG72sOhSMJlicgw
! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_7_NEW = `! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.1
||example.com^`;

export const FILTER_8_OLD = `! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_8_NEW = `! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.1
||example.com^`;

export const FILTER_9_OLD = `! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_9_NEW = `! Checksum: G3J40YYEG72sOhSMJlicgw
! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.1
||example.com^`;

export const FILTER_10_OLD = `! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_10_NEW = `! Title: Same file
! Version: v1.0.1
||example.com^`;

export const FILTER_11_OLD = `! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_11_NEW = `! Checksum: iP3cfJ4iR+MPqRJUsy8cWw
! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.0
||example.org^`;

export const FILTER_12_OLD = `! Checksum: G3J40YYEG72sOhSMJlicgw
! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_12_NEW = `! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.0
||example.org^`;

export const FILTER_13_OLD = `! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_13_NEW = `! Checksum: G3J40YYEG72sOhSMJlicgw
! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.0
||example.org^`;

export const FILTER_14_OLD = `! Checksum: G3J40YYEG72sOhSMJlicgw
! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_14_NEW = `! Title: Same file
! Version: v1.0.0
||example.org^`;

export const differentFiles = [
    ['tags are equal', FILTER_1_OLD, FILTER_1_NEW],
    ['diff-path changed in new file', FILTER_2_OLD, FILTER_2_NEW],
    ['diff-path moved and changed in new file', FILTER_3_OLD, FILTER_3_NEW],
    ['diff-path added in new file', FILTER_4_OLD, FILTER_4_NEW],
    ['diff-path removed in new file', FILTER_5_OLD, FILTER_5_NEW],
    ['checksum added in new file', FILTER_6_OLD, FILTER_6_NEW],
    ['checksum removed in new file', FILTER_7_OLD, FILTER_7_NEW],
    ['only diff-path added in new file', FILTER_8_OLD, FILTER_8_NEW],
    ['diff-path and checksum added in new file', FILTER_9_OLD, FILTER_9_NEW],
    ['without diff-path and checksum', FILTER_10_OLD, FILTER_10_NEW],
    ['content the same, but checksum added in new file', FILTER_11_OLD, FILTER_11_NEW],
    ['content the same, but checksum removed in new file', FILTER_12_OLD, FILTER_12_NEW],
    ['content the same, but diff-path and checksum added in new file', FILTER_13_OLD, FILTER_13_NEW],
    ['content the same, but diff-path and checksum removed in new file', FILTER_14_OLD, FILTER_14_NEW],
];
