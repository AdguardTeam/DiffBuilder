export const FILTER_1_OLD = `! Checksum: cfFHkZ0ySKUlGfUZtdjkkA
! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_1_NEW = `! Checksum: s2yci2esCuhdFLXcxTcqzg
! Title: Same file
! Version: v1.0.1
||example.com^`;
export const FILTER_1_NEW_WITH_UPDATED_TAGS = `! Checksum: AFRDox3tdyaBYuB2a//pIg
! Diff-Path: path-to-patches/new-patch-1.patch
! Title: Same file
! Version: v1.0.1
||example.com^`;
export const FILTER_1_PATCH = `d1 1
a1 2
! Checksum: AFRDox3tdyaBYuB2a//pIg
! Diff-Path: path-to-patches/new-patch-1.patch
d3 2
a4 2
! Version: v1.0.1
||example.com^`;

export const FILTER_2_OLD = `! Title: Same file
! Version: v1.0.0
||example.org^`;
export const FILTER_2_NEW = `! Checksum: s2yci2esCuhdFLXcxTcqzg
! Title: Same file
! Version: v1.0.1
||example.com^`;
export const FILTER_2_NEW_WITH_UPDATED_TAGS = `! Checksum: AFRDox3tdyaBYuB2a//pIg
! Diff-Path: path-to-patches/new-patch-1.patch
! Title: Same file
! Version: v1.0.1
||example.com^`;
export const FILTER_2_PATCH = `a0 2
! Checksum: AFRDox3tdyaBYuB2a//pIg
! Diff-Path: path-to-patches/new-patch-1.patch
d2 2
a3 2
! Version: v1.0.1
||example.com^`;

export const files = [
    [FILTER_1_OLD, FILTER_1_NEW, FILTER_1_PATCH, FILTER_1_NEW_WITH_UPDATED_TAGS],
    [FILTER_2_OLD, FILTER_2_NEW, FILTER_2_PATCH, FILTER_2_NEW_WITH_UPDATED_TAGS],
];
