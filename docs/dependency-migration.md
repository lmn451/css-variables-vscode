# Dependency migration

The npm lockfile is the dependency source of truth. Development and CI use Node.js
24 LTS and npm 11; `.nvmrc` selects that LTS line. The extension runs in VS Code's
own Node.js runtime. VS Code 1.91.0 ships Node.js 20.9, so the bundle explicitly
targets Node.js 20.9 and API types are pinned to VS Code 1.91.0. CI tests activation,
completion, hover, definition and shutdown at this minimum with built-in assertions,
and runs the full Mocha suite on current stable. Mocha 12's newer Node requirement
does not raise the production extension's runtime minimum.

The published `css-variable-lsp` is pinned to stable 1.0.22, matching the shared CSS
LSP contract. Its declared Node support is `20 || >=22`; it is independent of local
unpublished changes to the server repository. Rust binaries still come from the
existing release download script.

## Guides and applied changes

| Dependency                   | Primary upstream guide                                                                                                                                                                                                       | Applied migration                                                                                                                                                                                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| vscode-languageclient 9 → 11 | [LSP 10 and 11 history](https://github.com/microsoft/vscode-languageserver-node/blob/main/README.md#history)                                                                                                                 | Use export-aware Node16 module resolution; keep the public `/node` entry point and asynchronous start/stop lifecycle. No custom transports, middleware or client log channels need changes. The extension's own output channel is not passed as a client log channel.                                                     |
| ESLint 8 → 10                | [v9](https://eslint.org/docs/latest/use/migrate-to-9.0.0), [v10](https://eslint.org/docs/latest/use/migrate-to-10.0.0), [flat config](https://eslint.org/docs/latest/use/configure/migration-guide)                          | Replace `.eslintrc.json` with `eslint.config.cjs`, import recommended configurations, declare source files and ignores, and replace the old CLI extension selection with `eslint src`.                                                                                                                                    |
| typescript-eslint 5 → 8      | [v6](https://typescript-eslint.io/blog/announcing-typescript-eslint-v6/), [v7](https://typescript-eslint.io/blog/announcing-typescript-eslint-v7/), [v8](https://typescript-eslint.io/blog/announcing-typescript-eslint-v8/) | Use the aggregate `typescript-eslint` package, recommended typed rules and stable project service. Fix new lint findings without disabling the typed rules.                                                                                                                                                               |
| TypeScript 5.9 → 6.0.3       | [TypeScript 6](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html), [parser compatibility](https://typescript-eslint.io/users/dependency-versions/)                                              | Use modern Node16 resolution, explicit Node types for production and Node/Jest types for tests, explicit root directories and isolated modules. Stay on `~6.0.3`: the parser requires TypeScript `<6.1` and ts-jest requires `<7`; TypeScript 7's native compiler does not supply their required JavaScript compiler API. |
| Jest 29 → 30                 | [Jest 30 migration](https://jestjs.io/docs/upgrading-to-jest30), [ts-jest peers](https://www.npmjs.com/package/ts-jest)                                                                                                      | Update Jest types and ts-jest, use a dedicated test tsconfig, remove the redundant preset, and type-check tests explicitly. Existing tests use supported matchers, mocks and public APIs.                                                                                                                                 |
| Prettier 2 → 3               | [Prettier 3 breaking changes](https://prettier.io/blog/2023/07/05/3.0.0#breaking-changes)                                                                                                                                    | Keep explicit formatting options and CLI usage; no synchronous API or custom plugin migration is needed. Avoid a repository-wide formatting sweep.                                                                                                                                                                        |
| Husky 8 → 9                  | [v9 migration](https://github.com/typicode/husky/releases/tag/v9.0.1), [v9.1 hook changes](https://github.com/typicode/husky/releases/tag/v9.1.2)                                                                            | Put `prepare: husky` in scripts; remove the deprecated hook bootstrap and run lint-staged directly.                                                                                                                                                                                                                       |
| lint-staged 13 → 17          | [Changelog](https://github.com/lint-staged/lint-staged/blob/main/CHANGELOG.md)                                                                                                                                               | Use supported Node and Git (2.32+) versions; retain JSON configuration and direct executable tasks. Remove redundant `git add` because lint-staged stages task changes itself. No shell or YAML configuration is used.                                                                                                    |
| VSCE 3 → 4                   | [v4 release notes](https://github.com/microsoft/vscode-vsce/releases/tag/v4.0.0)                                                                                                                                             | Build/package on Node 24 (VSCE requires ≥22). Continue using documented package/publish CLI commands. Exclude new development config and scratch files from both universal and platform packages.                                                                                                                         |
| test-electron 2 → 3          | [Upstream package/runtime requirements](https://github.com/microsoft/vscode-test/blob/main/package.json), [changelog](https://github.com/microsoft/vscode-test/blob/main/CHANGELOG.md)                                       | Run the downloader on Node 24, add a dedicated minimum-host smoke command, open the fixture workspace, and move this integration-only tool to devDependencies.                                                                                                                                                            |
| Mocha 11 → 12                | [Changelog](https://github.com/mochajs/mocha/blob/main/CHANGELOG.md)                                                                                                                                                         | Load the new ESM entry point with dynamic import from the CommonJS suite runner; keep the public programmatic API. Move Mocha to devDependencies.                                                                                                                                                                         |
| glob 13 → 14                 | [v14 changes](https://github.com/isaacs/node-glob/blob/main/changelog.md#14)                                                                                                                                                 | Use the named `globSync` export for integration discovery. The simple `**/*.test.js` pattern needs no pattern changes. Move this integration-only dependency to devDependencies.                                                                                                                                          |
| esbuild 0.27 → 0.28          | [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md#0280)                                                                                                                                                    | Retain the context/rebuild API and set the explicit extension host target. No development server or affected CSS/ESM-only features are used.                                                                                                                                                                              |

Node type definitions intentionally remain on 20.x to model the supported extension
host; VS Code types intentionally remain at the declared minimum. These are runtime
compatibility constraints, rather than missed upgrades to the newest type packages.

## Transitive security fixes

Scoped overrides select glob 14.0.4 for the published CSS server, Jest's reporters,
configuration and runtime, Mocha and test-exclude. Their call sites use the retained
`glob`, `glob.sync`/`globSync`, `escape` and `hasMagic` APIs. The server's scan and
ignore matching use `cwd`, `ignore`, `absolute` and `nodir`, which remain supported.
The [glob 13/14 changes](https://github.com/isaacs/node-glob/blob/main/changelog.md)
remove the CLI and change internal matcher classes; none of these consumers use
that CLI or the changed internal classes. This fixes
[GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), where
cancellation could leave filesystem traversal running after a timeout.

Separate scoped minimatch 11.0.5 overrides cover ESLint/config-array,
typescript-estree, VSCE, Mocha and test-exclude. These parents use the retained
`minimatch()` or `new Minimatch().match()` interfaces, including ESLint's partial
matches; they do not access regex internals. The
[minimatch 11 changes](https://github.com/isaacs/minimatch/blob/main/changelog.md#110)
replace regex-based matching and remove `makeRe()`. The new matcher fixes
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249).

Two unique advisories remain and are not suppressed:

- **minimatch / vscode-languageclient (moderate):** client 11's
  `lib/common/utils/globPattern.js` and `lib/common/fileOperations.js` call
  `Minimatch.makeRe()`, so overriding its dependency to minimatch 11 would break
  dynamic registrations. The reported amplification requires `optimizationLevel`
  at least 2; these client call sites use the default level 1 and do not forward a
  server-selected optimization level. A compatible upstream client migration is
  still required to remove the advisory from the installed graph.
- **deepmerge / Jest configuration (low):**
  [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) concerns
  prototype poisoning while merging attacker-provided objects. The newest
  published version is still 4.3.1. It is used by development-only Jest
  configuration, not the extension bundle; this repository's Jest configuration is
  controlled source. There is no released fixed version to select.

## Verification

Verified with Node.js 24.22.2 and npm 11.21.2:

- A clean `HUSKY=0 npm ci` (skip Git hook installation in the isolated worktree),
  production and test type checks, and typed ESLint all pass.
- All 54 Jest tests pass with 95.48% statement coverage.
- All 46 Mocha integration tests pass on VS Code 1.145.2, exercising the downloaded
  Rust 0.3.8 backend.
- The final production bundle passes activation, completion, hover, definition and
  shutdown against the bundled TypeScript backend on VS Code 1.91.0 / Node 20.9.0.
- VSCE 4 packages the universal VSIX successfully (20 files, approximately 17 MB).
  Test/configuration/scratch files are excluded.
- The original lockfile audit reports 39 affected packages (9 low, 13 moderate,
  16 high, 1 critical). The final graph reports 8 (6 low, 2 moderate), tracing to the
  two unique advisories above. Production-only audit reports 2 moderate affected
  packages: minimatch and vscode-languageclient. No high or critical findings remain.
