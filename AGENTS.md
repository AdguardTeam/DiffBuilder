# AGENTS.md

## Project Overview

AdGuard Diff Builder (`@adguard/diff-builder`) is a tool for generating
differential (RCS-format) updates for ad-blocking filter lists. It compares old
and new versions of a filter file, produces a compact patch, and manages a
directory of time-limited patch files. A companion **diff-updater** module
applies those patches on the client side (browser or Node.js) by fetching and
applying them in sequence.

The project ships as:

- A **CLI** (`diff-builder build`) for CI pipelines.
- A **Node.js API** (`DiffBuilder.buildDiff`) for server-side integration.
- A **browser-compatible API** (`DiffUpdater.applyPatch`) for client-side patch
  application.

## Technical Context

| Field                 | Value                                                     |
| --------------------- | --------------------------------------------------------- |
| Language / Version    | TypeScript ~5.2, targeting ESNext; Node.js >= 20          |
| Package Manager       | pnpm 10.7.1                                               |
| Bundler               | Rollup 4 (CJS + ESM outputs)                              |
| Primary Dependencies  | `commander` (CLI), `crypto-js` (checksums)                |
| Testing               | Jest 29 with SWC transform                                |
| Linting               | ESLint 8 (airbnb-typescript + jsdoc plugin)               |
| Markdown Linting      | markdownlint-cli                                          |
| Type Checking         | `tsc --noEmit`                                            |
| Storage               | Filesystem (patch files); no database                     |
| Target Platforms      | Node.js (builder + CLI), Browser (updater)                |
| Project Type          | Single-package library + CLI                              |
| External Dependency   | Unix `diff` utility (required at runtime for builder)     |

## Project Structure

```text
.
├── src/
│   ├── bin/
│   │   └── cli.ts              # CLI entry point (commander-based)
│   ├── common/                 # Shared utilities (checksum, patch names, tags, etc.)
│   ├── diff-builder/           # Builder API — generates patches from filter diffs
│   │   ├── index.ts            # Public API surface (re-exports)
│   │   ├── build.ts            # Core build logic
│   │   └── tags.ts             # Filter metadata tag helpers
│   └── diff-updater/           # Updater API — applies RCS patches client-side
│       ├── index.ts            # Public API surface (re-exports)
│       ├── update.ts           # Core update / patch-application logic
│       └── unacceptable-response-error.ts  # Custom error for bad HTTP responses
├── tests/                      # Jest test suites and fixtures
│   ├── fixtures/               # Sample filter files and patches for tests
│   ├── server/                 # Express test server for updater integration tests
│   └── stubs/                  # Reusable test data factories
├── tasks/
│   └── build-txt.ts            # Post-build script (generates build.txt)
├── bamboo-specs/               # Bamboo CI pipeline definitions
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── rollup.config.ts
├── jest.config.ts
├── .eslintrc.js
├── .markdownlint.json
└── README.md
```

## Build And Test Commands

All commands use **pnpm** and are defined in `package.json`:

| Task              | Command              | Notes                                         |
| ----------------- | -------------------- | --------------------------------------------- |
| Build             | `pnpm build`         | Rollup bundle (CJS + ESM) + type emit         |
| Type-check only   | `pnpm lint:types`    | `tsc --noEmit`                                |
| Lint code         | `pnpm lint:code`     | ESLint with cache                             |
| Lint markdown     | `pnpm lint:md`       | markdownlint                                  |
| Lint all          | `pnpm lint`          | Runs `lint:code`, `lint:types`, `lint:md`     |
| Watch / rebuild   | `pnpm watch`         | Rollup in watch mode (development)            |
| Run tests         | `pnpm test`          | Jest (all suites)                             |
| Build types       | `pnpm build:types`   | Declaration emit only                         |
| Pack              | `pnpm tgz`           | Creates a tarball for distribution            |

## Contribution Instructions

After completing any code change, verify correctness by following every
applicable step below:

1. Run `pnpm lint` and fix all reported errors. This covers ESLint, TypeScript
   type checking, and Markdown linting in a single command.
2. Run `pnpm test` and ensure all 97 tests pass with zero failures.
3. If you changed or added functionality, add or update the corresponding tests
   in the `tests/` directory. Every public function must have test coverage.
4. If you added a new source file, confirm it is reachable from the existing
   module `index.ts` exports or from the CLI entry point.
5. Run `pnpm build` and confirm a clean build with no errors or warnings.
6. Verify that new code follows the Code Guidelines section below.
7. Do not commit generated files (`dist/`, `coverage/`, `node_modules/`).

## Code Guidelines

### Architecture

- The project is split into three public surfaces: **CLI** (`src/bin/cli.ts`),
  **builder API** (`src/diff-builder/`), and **updater API**
  (`src/diff-updater/`). Keep them decoupled — the updater must remain
  browser-compatible and must not import Node.js-only modules (`fs`, `path`,
  `child_process`).
- Shared logic lives in `src/common/`. Place code there only when it is used
  by more than one of the three surfaces.
- Each API directory exposes a single `index.ts` barrel file. Add new public
  exports there; do not export from nested files directly.

### Code Quality

- **Immutable parameters**: `no-param-reassign` is turned off project-wide,
  but prefer creating copies (e.g., `array.slice()`) over mutating inputs.

### Testing

- Test files live in `tests/` and follow the pattern `<feature>.test.ts`.
- Test data goes into `tests/stubs/` (programmatic factories) or
  `tests/fixtures/` (static sample files).
- The project uses SWC for fast Jest transforms — avoid Jest-incompatible
  syntax.
- Integration tests for the updater use a local Express server
  (`tests/server/index.ts`).

### Other

- The builder depends on the system `diff` utility at runtime. Tests that
  exercise `buildDiff` or `createPatch` require `diff` to be available on
  `PATH`.
- Patch filenames encode metadata (name, resolution, epoch timestamp,
  expiration period). Use `createPatchName` / `parsePatchName` from
  `src/common/patch-name.ts`; never construct patch filenames manually.
- Checksum algorithms differ by surface: the builder uses MD5 (`crypto-js`),
  the updater uses SHA-1 (`crypto-js`). Do not mix them.
