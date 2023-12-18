import { splitByLines } from '../src/common/split-by-lines';

describe('check splitByLines', () => {
    it('split by new lines (LF)', () => {
        const lines = 'line1\nline2\nline3\n';
        const split = splitByLines(lines);

        expect(split).toHaveLength(3);
        expect(split[0]).toStrictEqual('line1\n');
        expect(split[1]).toStrictEqual('line2\n');
        expect(split[2]).toStrictEqual('line3\n');
    });

    it('split by new lines without empty line in the end (LF)', () => {
        const lines = 'line1\nline2\nline3';
        const split = splitByLines(lines);

        expect(split).toHaveLength(3);
        expect(split[0]).toStrictEqual('line1\n');
        expect(split[1]).toStrictEqual('line2\n');
        expect(split[2]).toStrictEqual('line3');
    });

    it('split by new lines with empty line in the middle (LF)', () => {
        const lines = 'line1\n\nline3';
        const split = splitByLines(lines);

        expect(split).toHaveLength(3);
        expect(split[0]).toStrictEqual('line1\n');
        expect(split[1]).toStrictEqual('\n');
        expect(split[2]).toStrictEqual('line3');
    });

    it('split by new lines (CRLF)', () => {
        const lines = 'line1\r\nline2\r\nline3\r\n';
        const split = splitByLines(lines);

        expect(split).toHaveLength(3);
        expect(split[0]).toStrictEqual('line1\r\n');
        expect(split[1]).toStrictEqual('line2\r\n');
        expect(split[2]).toStrictEqual('line3\r\n');
    });

    it('split by new lines without empty line in the end (CRLF)', () => {
        const lines = 'line1\r\nline2\r\nline3';
        const split = splitByLines(lines);

        expect(split).toHaveLength(3);
        expect(split[0]).toStrictEqual('line1\r\n');
        expect(split[1]).toStrictEqual('line2\r\n');
        expect(split[2]).toStrictEqual('line3');
    });

    it('split by new lines with empty line in the middle (CRLF)', () => {
        const lines = 'line1\r\n\r\nline3';
        const split = splitByLines(lines);

        expect(split).toHaveLength(3);
        expect(split[0]).toStrictEqual('line1\r\n');
        expect(split[1]).toStrictEqual('\r\n');
        expect(split[2]).toStrictEqual('line3');
    });
});
