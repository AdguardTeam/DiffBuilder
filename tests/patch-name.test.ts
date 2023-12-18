import {
    type PatchName,
    Resolution,
    createPatchName,
    generateCreationTime,
    parsePatchName,
    timestampWithResolutionToMs,
    PATCH_FILE_ERROR_TEXT,
} from '../src/common/patch-name';
import { PATCH_EXTENSION } from '../src/diff-builder';

describe('check patches names', () => {
    describe('check createPatchName and parsePatchName', () => {
        const cases: (PatchName & { output: string })[] = [
            {
                name: 'filter',
                resolution: Resolution.Hours,
                time: 1,
                output: `filter-${generateCreationTime(Resolution.Hours)}-1${PATCH_EXTENSION}`,
            },
            {
                name: 'filter2',
                resolution: Resolution.Minutes,
                time: 60,
                output: `filter2-m-${generateCreationTime(Resolution.Minutes)}-60${PATCH_EXTENSION}`,
            },
            {
                name: 'filter3',
                resolution: Resolution.Seconds,
                time: 3600,
                output: `filter3-s-${generateCreationTime(Resolution.Seconds)}-3600${PATCH_EXTENSION}`,
            },
        ];

        it.each(cases)('%s', ({
            name,
            resolution,
            time,
            output,
        }) => {
            const patchName = createPatchName({
                name,
                resolution,
                time,
            });

            expect(patchName).toStrictEqual(output);

            const parsedPatchName = parsePatchName(patchName);

            expect(parsedPatchName.name).toStrictEqual(name);
            expect(parsedPatchName.resolution).toStrictEqual(resolution);
            expect(parsedPatchName.time).toStrictEqual(time);

            const epochTimestampMs = timestampWithResolutionToMs(
                parsedPatchName.epochTimestamp,
                parsedPatchName.resolution,
            );
            const expiredInMs = timestampWithResolutionToMs(
                parsedPatchName.time,
                parsedPatchName.resolution,
            );
            expect(epochTimestampMs + expiredInMs).toBeGreaterThan(new Date().getTime());
        });
    });

    it('check createPatchName with invalid name', () => {
        expect(() => {
            createPatchName({
                name: 'filter-1',
                resolution: Resolution.Hours,
                time: 1,
            });
        }).toThrowError(PATCH_FILE_ERROR_TEXT);
    });
});
