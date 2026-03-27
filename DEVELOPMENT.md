# Development Guide

This document explains how to set up the development environment, run the
project locally, and contribute code to AdGuard Diff Builder.

## Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
    - [Available Scripts](#available-scripts)
    - [Linting](#linting)
    - [Testing](#testing)
    - [Building](#building)
    - [Watch Mode](#watch-mode)
- [Common Tasks](#common-tasks)
    - [Running the CLI Locally](#running-the-cli-locally)
    - [Running a Single Test File](#running-a-single-test-file)
    - [Cleaning Build Artifacts](#cleaning-build-artifacts)
    - [Creating a Tarball](#creating-a-tarball)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

## Prerequisites

Install the following tools before working on the project:

| Tool                           | Version    | Notes                                               |
| ------------------------------ | ---------- | --------------------------------------------------- |
| [Node.js](https://nodejs.org/) | >= 20      | The `engines` field in `package.json` enforces this |
| [pnpm](https://pnpm.io/)       | 10.7.1     | Install with `npm install -g pnpm@10.7.1`           |
| [Git](https://git-scm.com/)    | any recent | Required for cloning and version control            |
| Unix `diff` utility            | any        | Required at runtime by the builder (see below)      |

### Unix `diff` utility

The builder shells out to the system `diff` command to generate patches. Verify
it is available:

```bash
diff --version
```

- **macOS** — available by default (or via Xcode CLI tools:
  `xcode-select --install`).
- **Linux** — available by default, or install with
  `apt-get install diffutils` / `yum install diffutils`.
- **Windows** — use WSL or Git Bash, which includes `diff`.

## Getting Started

1. **Clone the repository**

    ```bash
    git clone https://github.com/AdguardTeam/DiffBuilder.git
    cd DiffBuilder
    ```

2. **Install dependencies**

    ```bash
    pnpm install
    ```

3. **Verify the setup**

    Run the linter and tests to confirm everything is working:

    ```bash
    pnpm lint
    pnpm test
    ```

    All 97 tests should pass. If anything fails, see
    [Troubleshooting](#troubleshooting).

## Development Workflow

### Available Scripts

All scripts are defined in `package.json` and invoked via `pnpm`:

| Command            | Description                                              |
| ------------------ | -------------------------------------------------------- |
| `pnpm build`       | Rollup bundle (CJS + ESM) + type declarations            |
| `pnpm build:types` | Emit TypeScript declaration files only                   |
| `pnpm watch`       | Rollup in watch mode — rebuilds on file changes          |
| `pnpm lint`        | Run all linters (`lint:code` + `lint:types` + `lint:md`) |
| `pnpm lint:code`   | ESLint with cache                                        |
| `pnpm lint:types`  | TypeScript type checking (`tsc --noEmit`)                |
| `pnpm lint:md`     | markdownlint on all Markdown files                       |
| `pnpm test`        | Run the full Jest test suite                             |
| `pnpm tgz`         | Pack the project into `diff-builder.tgz`                 |

### Linting

The project enforces three kinds of linting. Run them all at once with:

```bash
pnpm lint
```

Or individually:

```bash
pnpm lint:code    # ESLint (airbnb-typescript + jsdoc rules)
pnpm lint:types   # TypeScript type checking
pnpm lint:md      # Markdown linting
```

See [AGENTS.md](AGENTS.md) for the full code guidelines.

### Testing

Tests use Jest 29 with SWC for fast TypeScript transforms:

```bash
pnpm test
```

- Test files are in `tests/` and follow the `<feature>.test.ts` naming
  convention.
- Static test data lives in `tests/fixtures/`.
- Programmatic test data factories are in `tests/stubs/`.
- Integration tests for the updater use a local Express server defined in
  `tests/server/index.ts`.
- Tests that exercise `buildDiff` or `createPatch` require the system `diff`
  utility to be on `PATH`.

### Building

```bash
pnpm build
```

This runs `rimraf dist` (clean), emits type declarations, bundles CJS + ESM
outputs via Rollup, and generates `build.txt`. The output goes to `dist/`:

```text
dist/
├── api/
│   ├── builder/
│   │   ├── cjs/index.js
│   │   └── es/index.js
│   └── updater/
│       ├── cjs/index.js
│       └── es/index.js
├── bin/
│   └── diff-builder       # CLI entry point
└── types/
    ├── diff-builder/
    └── diff-updater/
```

### Watch Mode

For active development, use watch mode to rebuild automatically on changes:

```bash
pnpm watch
```

## Common Tasks

### Running the CLI Locally

After building, run the CLI directly:

```bash
pnpm build
node dist/bin/diff-builder build \
    -n my-filter \
    -t 60 \
    -r m \
    old_filter.txt \
    new_filter.txt \
    patches/
```

Add `-v` for verbose output or `-c` to include checksums in patches.

### Running a Single Test File

```bash
pnpm exec jest tests/diff-builder.test.ts
```

Or run tests matching a pattern:

```bash
pnpm exec jest --testPathPattern="patch-name"
```

### Cleaning Build Artifacts

```bash
pnpm exec rimraf dist coverage
```

### Creating a Tarball

```bash
pnpm tgz
```

This produces `diff-builder.tgz` in the project root, suitable for local
testing with `pnpm add ./diff-builder.tgz` in another project.

## Troubleshooting

### `diff: command not found`

The builder depends on the system `diff` utility. Install it:

- **macOS**: `xcode-select --install`
- **Debian/Ubuntu**: `sudo apt-get install diffutils`
- **RHEL/Fedora**: `sudo yum install diffutils`
- **Windows**: Use WSL or Git Bash.

### Tests fail with `Cannot find module` errors

Dependencies may not be installed. Run:

```bash
pnpm install
```

### Node.js version mismatch

The project requires Node.js >= 20. Check your version:

```bash
node --version
```

If it's too old, upgrade via [nvm](https://github.com/nvm-sh/nvm) or download
from [nodejs.org](https://nodejs.org/).

### Wrong pnpm version

The project uses pnpm 10.7.1. Install the correct version:

```bash
npm install -g pnpm@10.7.1
pnpm --version
```

### ESLint cache issues

If linting produces unexpected results after changing ESLint config, clear the
cache:

```bash
rm -f .eslintcache
pnpm lint:code
```

### Build fails after pulling new changes

Clean the build output and reinstall dependencies:

```bash
pnpm exec rimraf dist node_modules
pnpm install
pnpm build
```

## Additional Resources

- [README.md](README.md) — Project overview, installation, CLI usage, and API
  examples.
- [AGENTS.md](AGENTS.md) — Code guidelines, architecture decisions, and
  contribution checklist.
- [CHANGELOG.md](CHANGELOG.md) — Release history and notable changes.
