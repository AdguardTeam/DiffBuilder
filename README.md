# AdGuard Diff Builder

`@adguard/diff-builder` is an npm package for generating and applying
differential updates for ad-blocking filter lists. Instead of re-downloading
a full filter on every update, the server produces a compact RCS-format patch
for each revision and the client fetches only the patches it has not yet
applied.

The package ships two independent APIs and a CLI:

- **`DiffBuilder`** — server-side (Node.js / CI): compares two filter
  revisions, writes a patch file, and manages the patch directory.
- **`DiffUpdater`** — client-side (Node.js or browser): fetches pending
  patches from a URL and applies them to a locally stored filter.
- **`diff-builder` CLI** — wraps `DiffBuilder` for use in shell scripts and
  CI pipelines.

## Contents

- [Key Concepts](#key-concepts)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [CLI Reference](#cli-reference)
- [API Reference](#api-reference)
    - [DiffBuilder (Node.js)](#diffbuilder-nodejs)
    - [DiffUpdater (Node.js / Browser)](#diffupdater-nodejs--browser)
- [Documentation](#documentation)

## Key Concepts

**Filter list** — a plain-text file containing ad-blocking rules. Each
published revision is a snapshot of the file.

**RCS patch** — a compact diff in
[RCS format](https://www.gnu.org/software/diffutils/manual/diffutils.html#RCS)
that encodes the changes between two consecutive filter revisions. Clients
apply patches sequentially to advance from any past revision to the current
one without downloading the full file.

**Patch name** — every patch file is named so its metadata can be decoded
without reading the file:

```text
<name>[-<resolution>]-<epochTimestamp>-<expirationPeriod>.patch
```

- `name` — arbitrary identifier string (1–64 characters, no spaces).
- `resolution` — optional time unit for the two numeric fields: `h` (hours,
  default), `m` (minutes), `s` (seconds).
- `epochTimestamp` — time the patch was created, in the chosen resolution.
- `expirationPeriod` — how long the patch is valid, in the chosen resolution.

**`Diff-Path` tag** — a metadata line written into the filter file that tells
clients the URL of the patch directory:

```text
! Diff-Path: https://example.com/filters/patches/v1.2.3-m-28334060-60.patch
```

`DiffBuilder` adds and updates this tag automatically. `DiffUpdater` reads it
to discover where to fetch patches.

**Checksum** — an optional SHA-1 hash embedded in the patch's `diff`
directive. When present, `DiffUpdater` validates the filter content after
applying the patch and rejects it if the hash does not match.

## Installation

<!-- NOTE: Minimal supported Node.js version should be specified in package.json -->
<!-- and the same one should be used for testing in .github/workflows/test.yaml -->

**Runtime requirements:**

- [Node.js] v20 or higher (for builder and CLI; the updater also runs in
  browsers).
- Unix `diff` utility (required by the builder at runtime):
    - macOS — available by default, or via `xcode-select --install`.
    - Linux — available by default, or `apt-get install diffutils`.
    - Windows — available in WSL or Git Bash.

[Node.js]: https://nodejs.org/en/download

**Add to your project:**

```bash
npm install @adguard/diff-builder
# or
pnpm add @adguard/diff-builder
```

## Quick Start

### Generating a patch (server / CI)

```bash
# CLI: compare old_filter.txt → new_filter.txt, write patch to patches/
diff-builder build \
    -n my-filter \
    -t 60 \
    -r m \
    old_filter.txt \
    new_filter.txt \
    patches/
```

### Applying patches (client)

```javascript
import { DiffUpdater } from '@adguard/diff-builder/diff-updater/es';

const updatedFilter = await DiffUpdater.applyPatch({
    filterUrl: 'https://example.com/filters/filter.txt',
    filterContent: currentFilterText,
});
```

## CLI Reference

```text
diff-builder build [options] <old_filter> <new_filter> <path_to_patches>
```

**Positional arguments:**

| Argument            | Description                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `<old_filter>`      | Path to the previous filter revision.                                                       |
| `<new_filter>`      | Path to the new filter revision. The file is updated in-place with the new `Diff-Path` tag. |
| `<path_to_patches>` | Directory where patch files are stored. Created if it does not exist.                       |

**Options:**

| Option                                  | Required | Description                                                                                       |
| --------------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `-n, --name <name>`                     | Yes      | Patch identifier: 1–64 characters, no spaces or special characters.                               |
| `-t, --time <expirationPeriod>`         | Yes      | How long the patch is valid, in units set by `--resolution`.                                      |
| `-r, --resolution <h\|m\|s>`            | No       | Time unit for `--time` and the embedded timestamp: `h` hours (default), `m` minutes, `s` seconds. |
| `-c, --checksum`                        | No       | Embed a SHA-1 checksum of the post-patch filter content in the patch.                             |
| `-d, --delete-older-than-sec <seconds>` | No       | Remove non-empty patch files older than this many seconds. Default: `604800` (7 days).            |
| `-v, --verbose`                         | No       | Print progress messages to stdout.                                                                |

**Example — 60-minute patches with checksum validation:**

```bash
diff-builder build \
    -n adguard-base \
    -t 60 \
    -r m \
    -c \
    -v \
    filters/base_old.txt \
    filters/base.txt \
    filters/patches/
```

## API Reference

### DiffBuilder (Node.js)

Generates a patch file from two filter revisions and manages the patch
directory. Requires Node.js and the system `diff` utility.

#### CJS

```javascript
const { DiffBuilder } = require('@adguard/diff-builder');
```

#### ESM

```javascript
import { DiffBuilder } from '@adguard/diff-builder/es';
```

#### `DiffBuilder.buildDiff(params)`

```javascript
await DiffBuilder.buildDiff({
    oldFilterPath,   // string — path to the previous filter revision
    newFilterPath,   // string — path to the new filter revision (updated in-place)
    patchesPath,     // string — directory to read/write patch files
    name,            // string — patch identifier (1–64 chars, no spaces)
    time,            // number — expiration period in units of `resolution`
    resolution,      // 'h' | 'm' | 's' — time unit (default: 'h')
    checksum,        // boolean — embed SHA-1 checksum (default: false)
    deleteOlderThanSec, // number — TTL for old patches in seconds (default: 604800)
    verbose,         // boolean — print progress messages (default: false)
});
```

When called:

1. If no meaningful changes exist between the two filters, the function exits
   without writing any files.
2. Otherwise it creates a new patch file in `patchesPath`, updates the
   `Diff-Path` tag in `newFilterPath`, and removes expired patches.

### DiffUpdater (Node.js / Browser)

Fetches and applies pending patches to bring a locally stored filter up to
date. Compatible with both Node.js and browser environments — does not use
`fs`, `path`, or `child_process`.

#### CJS

```javascript
const { DiffUpdater } = require('@adguard/diff-builder/diff-updater');
```

#### ESM

```javascript
import { DiffUpdater } from '@adguard/diff-builder/diff-updater/es';
```

#### `DiffUpdater.applyPatch(params)`

```javascript
const updatedFilter = await DiffUpdater.applyPatch({
    filterUrl,      // string — URL of the filter file (used to resolve patch URLs)
    filterContent,  // string — current filter text stored by the client
    verbose,        // boolean — print progress messages (default: false)
});
// Returns the updated filter content as a string.
```

The function:

1. Reads the `Diff-Path` tag from `filterContent` to locate the patch
   directory.
2. Fetches the patch file at that URL. If the server returns 204 or 404, the
   filter is already current and the original `filterContent` is returned
   unchanged.
3. Applies the RCS operations from the patch to `filterContent`.
4. If the patch contains a checksum, validates the result and throws if it
   does not match.
5. Reads the new `Diff-Path` tag from the updated content and repeats until
   no further patches are available.

**Errors:**

- Throws `UnacceptableResponseError` if the server returns an HTTP status
  other than 200, 204, or 404.
- Throws a generic `Error` if a patch is malformed or checksum validation
  fails.

```javascript
import {
    DiffUpdater,
    UnacceptableResponseError,
} from '@adguard/diff-builder/diff-updater/es';

try {
    const updated = await DiffUpdater.applyPatch({ filterUrl, filterContent });
} catch (err) {
    if (err instanceof UnacceptableResponseError) {
        // Network/server error — handle or retry
    }
    throw err;
}
```

## Documentation

- [Development](DEVELOPMENT.md)
- [Changelog](CHANGELOG.md)
- [LLM agent rules](AGENTS.md)
