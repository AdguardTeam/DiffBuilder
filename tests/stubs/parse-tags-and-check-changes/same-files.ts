export const FILTER_1_OLD = `! Checksum: G3J40YYEG72sOhSMJlicgw
! Title: Same file
! Version: v1.0.0
! Diff-Path: ../patches/1/1-m-28378132-60.patch
||example.org^`;
export const FILTER_1_NEW = `! Checksum: iP3cfJ4iR+MPqRJUsy8cWw
! Title: Same file
! Version: v1.0.0
! Diff-Path: ../patches/1/1-m-28378192-60.patch
||example.org^`;

export const FILTER_2_OLD = `! Checksum: G3J40YYEG72sOhSMJlicgw
! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_2_NEW = `! Checksum: iP3cfJ4iR+MPqRJUsy8cWw
! Diff-Path: ../patches/1/1-m-28378192-60.patch
! Title: Same file
! Version: v1.0.0
||example.org^`;

export const FILTER_3_OLD = `! Checksum: G3J40YYEG72sOhSMJlicgw
! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_3_NEW = `! Checksum: iP3cfJ4iR+MPqRJUsy8cWw
! Title: Same file
! Version: v1.0.0
! Diff-Path: ../patches/1/1-m-28378192-60.patch
||example.org^`;

export const FILTER_4_OLD = `! Checksum: G3J40YYEG72sOhSMJlicgw
! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_4_NEW = `! Checksum: iP3cfJ4iR+MPqRJUsy8cWw
! Title: Same file
! Version: v1.0.0
! Diff-Path: ../patches/1/1-m-28378192-60.patch
||example.org^`;

export const FILTER_5_OLD = `! Checksum: G3J40YYEG72sOhSMJlicgw
! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_5_NEW = `! Checksum: iP3cfJ4iR+MPqRJUsy8cWw
! Title: Same file
! Version: v1.0.0
||example.org^`;

export const FILTER_6_OLD = `! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_6_NEW = `! Diff-Path: ../patches/1/1-m-28378132-60.patch
! Title: Same file
! Version: v1.0.0
||example.org^`;

export const FILTER_7_OLD = `! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_7_NEW = `! Title: Same file
! Version: v1.0.0
||example.org^`;

export const sameFiles = [
    ['diff-path somewhere in headers section', FILTER_1_OLD, FILTER_1_NEW],
    ['diff-path right after checksum, on the second line', FILTER_2_OLD, FILTER_2_NEW],
    ['diff-path moved to new line in new file', FILTER_3_OLD, FILTER_3_NEW],
    ['diff-path added in new file', FILTER_4_OLD, FILTER_4_NEW],
    ['diff-path removed in new file', FILTER_5_OLD, FILTER_5_NEW],
    ['only diff-path added in new file', FILTER_6_OLD, FILTER_6_NEW],
    ['files without changes', FILTER_7_OLD, FILTER_7_NEW],
];
