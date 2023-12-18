# AdGuard Diff Builder

A tool for generating differential updates for filter lists.

- [How to install](#how-to-install)
- [How to use](#how-to-use)
   - [Use as CLI](#cli)
   - [Use as API](#api)
- [Algorithm](#algorithm)

## How to install

`yarn add @adguard/diff-builder`

## How to Use

## CLI

```bash
diff-builder build [-c] [-d <seconds>] [-r <resolution>] [-v] -n <name> -t <expirationPeriod> <old_filter> <new_filter> <path_to_patches>
```

Where:

- `<old_filter>` — the relative path to the old filter.
- `<new_filter>` — the relative path to the new filter.
- `<path_to_patches>` — the relative path to the directory where the patch should be saved.
- `-n <name>` or `--name=<name>` — name of the patch file, an arbitrary string to identify the patch.
  Must be a string of length 1-64 with no spaces or other special characters.
- `-r <timestampResolution>` or `--resolution=<timestampResolution>` — is an optional flag,
  that specifies the resolution for both `expirationPeriod` and `epochTimestamp` (timestamp when the patch was generated).
  Possible values:
    - `h` — hours (used if `resolution` is not specified)
    - `m` — minutes
    - `s` — seconds
- `-t <expirationPeriod>` or `--time=<expirationPeriod>` — expiration time for the diff update
  (the unit depends on `resolution` parameter).
- `-d <seconds>` or `--delete-older-than-sec=<seconds>` — an optional parameter,
  this time *in seconds* will be used when scanning the `<path_to_patches>` folder to remove patches
  whose `mtime` is older than the specified time. By default, it will be `604800` (7 days).
- `-v` or `--verbose` — verbose mode.
- `-c` or `--checksum` — an optional flag, indicating whether it should calculate the SHA sum for the filter
  and add it to the `diff` directive with the filter name and the number of changed lines,
  following this format: `diff name:[name] checksum:[checksum] lines:[lines]`:
    - `name` — the name of the corresponding filter list.
      This key-value pair is optional — it will be included only if there is a `Diff-Name` tag in the `<old_filter>`.
    - `checksum` — the expected SHA1 checksum of the file after the patch is applied.
      This is used to validate the patch.
    - `lines` — the number of lines that follow, making up the RCS diff block.
      Note that `lines` are counted using the same algorithm as used by `wc -l`, essentially counting `\n`.

## Algorithm

### 1. Logging and File Path Resolution

    - Create a logger for verbose output if `verbose` is `true`.
    - Resolve the absolute paths for `oldFilterPath`, `newFilterPath`, and `patchesPath`.

### 2. Read and Split Filter Contents

    - Read the contents of `oldFilterPath` and `newFilterPath` into `oldFile` and `newFile`.
    - Determine the line endings for `oldFile` and `newFile`.
    - Split the contents of `oldFile` and `newFile` into arrays of lines (`oldFileSplitted` and `newFileSplitted`).

### 3. Parse `Diff-Path` Tag

    - Parse the `Diff-Path` tag from `oldFileSplitted` and store it in `oldFileDiffName`.

### 4. Create Patches Folder

    - Create the `patchesPath` directory recursively if it doesn't exist. Log if it's created.

### 5. Delete Outdated Patches

    - Scan `patchesPath` and delete outdated patches older than `deleteOlderThanSec`. Log the number of deleted patches.

## 6. Check for File Sameness

   - Compare the checksums of `oldFile` and `newFile`. If they match, log and exit.

## 7. Generate and Save the Diff

    - Generate a new patch name based on parameters.
    - Create an empty patch file for the new version if it doesn't exist.
    - Update the `Diff-Path` tag in `newFileSplitted`.
    - Calculate and save the difference between `oldFile` and `newFile` as a patch file.

## 8. Log Patch File Path and Completion

    - Log the path where the patch file is saved.
    - The process is completed.

## Important

The `oldFilterPath` is expected to already contain a `Diff-Path` tag.

## API

### CJS

```javascript
const { DiffBuilder } = require('@adguard/diff-builder');
const { DiffUpdater } = require('@adguard/diff-builder/diff-updater');

await DiffBuilder.buildDiff({
   oldFilterPath,
   newFilterPath,
   patchesPath,
   name,
   time,
   resolution,
   verbose: true,
});

const updatedFilter = await DiffUpdater.applyPatch({
    filterUrl,
    filterContent,
    verbose: true,
});
```

### ESM

```javascript
import { DiffBuilder } from '@adguard/diff-builder/es';
import { DiffUpdater } from '@adguard/diff-builder/diff-updater/es';

await DiffBuilder.buildDiff({
   oldFilterPath,
   newFilterPath,
   patchesPath,
   name,
   time,
   resolution,
   verbose: true,
});

const updatedFilter = await DiffUpdater.applyPatch({
    filterUrl,
    filterContent,
    verbose: true,
});
```
