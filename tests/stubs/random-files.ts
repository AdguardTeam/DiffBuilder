import { MOCK_DATE_NOW_MS } from '../mocks';

export const FILE_1 = `The Way that can be told of is not the eternal Way;
The name that can be named is not the eternal name.
The Nameless is the origin of Heaven and Earth;
The Named is the mother of all things.
Therefore let there always be non-being,
  so we may see their subtlety,
And let there always be being,
  so we may see their outcome.
The two are the same,
But after they are produced,
  they have different names.
`;

export const FILE_2 = `The Nameless is the origin of Heaven and Earth;
The named is the mother of all things.

Therefore let there always be non-being,
  so we may see their subtlety,
And let there always be being,
  so we may see their outcome.
The two are the same,
But after they are produced,
  they have different names.
They both may be called deep and profound.
Deeper and more profound,
The door of all subtleties!
`;

export const FILE_1_2_PATCH = `d1 2
d4 1
a4 2
The named is the mother of all things.

a11 3
They both may be called deep and profound.
Deeper and more profound,
The door of all subtleties!`;

// eslint-disable-next-line max-len
export const FILE_2_DIFF_DIRECTIVE = `diff checksum:6c5cf1b40522bca8f37fd3b2963b543691f80e6d lines:8 timestamp:${MOCK_DATE_NOW_MS}`;

export const FILE_3 = `string1
string2
string3
string4
string5
string6
string7
string8
string9
string10
string11
string12
string13
string14
`;

export const FILE_4 = `added1
string2
added2
added3
string4
string8
string9
added4
added5
added6
string10
added7
string11
added8
added9
string12
added10
added11
added12
string13
added13
added14
added15
added16
string14
`;

export const FILE_3_4_PATCH = `d1 1
a1 1
added1
d3 1
a3 2
added2
added3
d5 3
a9 3
added4
added5
added6
a10 1
added7
a11 2
added8
added9
a12 3
added10
added11
added12
a13 4
added13
added14
added15
added16`;

// eslint-disable-next-line max-len
export const FILE_4_DIFF_DIRECTIVE = `diff checksum:a07db16bbb507198c14e79ed0b51580d23054cc2 lines:25 timestamp:${MOCK_DATE_NOW_MS}`;

export const FILE_5 = `string1
string2
string3
string4
string5
string6
string7
string8
string9
string10
string11
string12
string13
string14
`;

export const FILE_6 = `string1
added1
string2
added2
string3
added3
string4
added4
string5
added5
string6
added6
string7
added7
string8
added8
string9
added9
string10
string11
string12
string13
string14
`;

export const FILE_5_6_PATCH = `a1 1
added1
a2 1
added2
a3 1
added3
a4 1
added4
a5 1
added5
a6 1
added6
a7 1
added7
a8 1
added8
a9 1
added9`;

// eslint-disable-next-line max-len
export const FILE_6_DIFF_DIRECTIVE = `diff checksum:7c425c14f12deb44e657f5cdefd54ef27bfa2716 lines:17 timestamp:${MOCK_DATE_NOW_MS}`;

export const FILE_7 = `string1
string2
string3
string4
string5
string6
string7
string8
string9
string10
string11
string12
string13
string14
`;

export const FILE_8 = `string1
string2
string3
string4
string5
string6
string7
string8
string9
string10
string11
string12
string13
string14
append1
append2
append3
append4
append5
append6
append7
`;

export const FILE_7_8_PATCH = `a14 7
append1
append2
append3
append4
append5
append6
append7`;

// eslint-disable-next-line max-len
export const FILE_8_DIFF_DIRECTIVE = `diff checksum:31aaea86448ec1ebc1fd6443901cc75537f43d11 lines:7 timestamp:${MOCK_DATE_NOW_MS}`;
