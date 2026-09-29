export const BUILD_DIFF_OLD_FILTER = [
    '! Title: Test filter',
    '! Diff-Path: patches/test-h-1000-60.patch',
    '||example.com^',
    '',
].join('\n');

export const BUILD_DIFF_NEW_FILTER = [
    '! Title: Test filter',
    '! Diff-Path: patches/test-h-1000-60.patch',
    '||example.com^',
    '||example.org^',
    '',
].join('\n');
