#!/usr/bin/env node
import { Command } from 'commander';

import { buildDiff } from './build';
import { version } from '../package.json';

const program = new Command();

/**
 * CLI wrapper for {@link buildDiff} function.
 */
async function main(): Promise<void> {
    program
        .name('diff-builder')
        .description('A tool for generating differential updates for filter lists.')
        .version(version);

    program
        .command('build')
        .argument('<old_filter>', 'the relative path to the old filter')
        .argument('<new_filter>', 'the relative path to the new filter')
        // eslint-disable-next-line max-len
        .argument('<path_to_patches>', 'the relative path (relative to the old filter) to the directory where the patch should be saved. The patch filename will be `<path_to_patches>/$PATCH_VERSION.patch`, where `$PATCH_VERSION` is the value of `Version` from `<old_filter>`')
        // eslint-disable-next-line max-len
        .option('-c, --checksum', 'an optional flag, indicating whether it should calculate the SHA sum for the filter and add it to the `diff` directive with the filter name and the number of changed lines, following this format: `diff name:[name] checksum:[checksum] lines:[lines]`')
        // eslint-disable-next-line max-len
        .option('-d, --delete-older-than <seconds>', 'an optional parameter, the time to live for the patch in *seconds*. By default, it will be `604800` (7 days). The utility will scan `<path_to_patches>` and delete patches whose `mtime` has expired')
        .action(async (
            oldFilterPath,
            newFilterPath,
            pathToPatches,
            options,
        ) => {
            const {
                checksum,
                deleteOlderThan,
            } = options;

            await buildDiff(
                oldFilterPath,
                newFilterPath,
                pathToPatches,
                checksum,
                deleteOlderThan,
            );
        });

    program.parseAsync(process.argv);
}

const isRunningViaCli = require.main === module;

if (isRunningViaCli) {
    main();
}
