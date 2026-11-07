# Contributing

Development steps:

Use Node.js 24 LTS (`nvm use`) and npm 11. The npm lockfile is authoritative;
install with `npm ci`. Git 2.32 or later is required by lint-staged. The development
Node requirement is separate from VS Code's bundled extension host runtime.

1. Install dependencies

```bash
npm ci
```

2. Type check

```bash
npm run check-types
```

3. Run tests

```bash
npm test
```

4. Build

```bash
npm run compile
```

5. Run extension in VS Code

- Open the repo in VS Code and press `F5` to start an Extension Development Host.

The minimum supported VS Code version is 1.91.0 (Node.js 20.9).
`npm run test:integration:minimum` checks activation, completion, hover, definition
and shutdown on that host using Node assertions. `npm run test:integration` runs
the full Mocha suite on current stable; Mocha 12 requires a newer Node runtime
than the minimum extension host. CI runs both. Build output targets Node.js 20.9,
and the VS Code API types are pinned to the supported minimum.

See [the dependency migration notes](docs/dependency-migration.md) for upstream
guides and compatibility decisions, including the TypeScript 6 constraint.
