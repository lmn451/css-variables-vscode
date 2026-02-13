# CSS Variables (LSP) for VS Code

Project-wide CSS custom properties (variables) support for VS Code, powered by `css-variable-lsp`.

## Features

- Workspace indexing of CSS variables across `.css`, `.scss`, `.sass`, `.less`, and HTML `<style>` blocks / inline styles.
- Context-aware completion for `var(--...)` and CSS property values.
- Hover that shows cascade-ordered definitions (`!important`, specificity, source order).
- Configurable severity for undefined variable hover diagnostics.
- Go to definition and find references for CSS variables.
- Color decorations on `var(--...)` usages (the extension runs the LSP with `--color-only-variables`).
- Works in CSS, SCSS, Sass, Less, HTML, JavaScript/TypeScript (JSX/TSX), Svelte, Vue, Astro, and PostCSS.

## Installation

1. Open VS Code
2. Go to Extensions (Cmd+Shift+X or Ctrl+Shift+X)
3. Search for "CSS Variables (LSP)"
4. Click Install

The extension bundles both a high-performance Rust LSP server and a TypeScript fallback. The Rust server is used automatically when available on your platform, with automatic fallback to TypeScript if needed.

## LSP Server Implementation

This extension supports two LSP server implementations:

### Rust LSP (Recommended)

- **Performance**: Native binary, faster startup and lower memory usage
- **Size**: ~2MB per platform
- **Transport**: stdio
- **Availability**: macOS (x64/ARM64), Linux (x64/ARM64), Windows (x64/ARM64)

### TypeScript LSP (Fallback)

- **Compatibility**: Works on all platforms where Node.js runs
- **Size**: ~4MB bundled
- **Transport**: IPC
- **Availability**: Universal fallback

The extension automatically selects the best available server based on your platform. You can control this behavior with the `cssVariables.serverImplementation` setting.

## Configuration

You can override the lookup globs and folder blacklist via VS Code settings. Open
Settings JSON (Cmd+, then "Open Settings JSON") and add:

```json
{
  "cssVariables.lookupFiles": ["**/*.css", "**/*.scss", "**/*.vue"],
  "cssVariables.blacklistFolders": ["**/dist/**", "**/node_modules/**"]
}
```

Provided lists replace the defaults (include any defaults you still want).

Defaults:

- `lookupFiles`:
  - `**/*.less`
  - `**/*.scss`
  - `**/*.sass`
  - `**/*.css`
  - `**/*.html`
  - `**/*.vue`
  - `**/*.svelte`
  - `**/*.astro`
  - `**/*.ripple`
- `blacklistFolders`:
  - `**/.cache/**`
  - `**/.DS_Store`
  - `**/.git/**`
  - `**/.hg/**`
  - `**/.next/**`
  - `**/.svn/**`
  - `**/bower_components/**`
  - `**/CVS/**`
  - `**/dist/**`
  - `**/node_modules/**`
  - `**/tests/**`
  - `**/tmp/**`

Both settings accept standard glob patterns (including brace expansions like `**/*.{css,scss}`).
Note: these are glob patterns (not gitignore rules). To exclude files inside a directory,
include `/**` at the end (for example `**/dist/**`).

### Server Implementation (New)

Control which LSP server implementation to use:

- `cssVariables.serverImplementation` (default `"auto"`):

  - `"auto"` - Try Rust first, fall back to TypeScript if unavailable
  - `"rust"` - Use only the Rust implementation (fails if not available)
  - `"typescript"` - Use only the TypeScript implementation

- `cssVariables.serverBinaryPath` (default `""`):
  - Path to a custom css-lsp-rust binary
  - Only used when `serverImplementation` is `"auto"` or `"rust"`
  - Useful for testing development builds or using a system-installed binary

Example configuration to force TypeScript:

```json
{
  "cssVariables.serverImplementation": "typescript"
}
```

Example configuration with custom binary:

```json
{
  "cssVariables.serverImplementation": "rust",
  "cssVariables.serverBinaryPath": "/usr/local/bin/css-variable-lsp"
}
```

### Color Preview (Optional)

- `cssVariables.colorOnlyVariables` (default `true`): show colors only for `var(--...)` usages.
- `cssVariables.noColorPreview` (default `false`): disable color decorations entirely.

### Completion Path Display (Optional)

- `cssVariables.pathDisplay` (default `relative`): `relative`, `absolute`, or `abbreviated`.
- `cssVariables.pathDisplayLength` (default `1`): segment length when using `abbreviated`.

### Undefined Variable Hover (Optional)

- `cssVariables.undefinedVarFallback` (default `warning`): `warning`, `info`, or `off`.

## LSP Flags & Environment

The extension launches `css-variable-lsp` with `--color-only-variables` by default and
passes settings as CLI flags:

- `cssVariables.lookupFiles` -> repeated `--lookup-file` flags
- `cssVariables.blacklistFolders` -> repeated `--ignore-glob` flags
- `cssVariables.pathDisplay` -> `--path-display`
- `cssVariables.pathDisplayLength` -> `--path-display-length`
- `cssVariables.noColorPreview` -> `--no-color-preview`
- `cssVariables.undefinedVarFallback` -> `--undefined-var-fallback`

Supported LSP flags:

- `--no-color-preview`
- `--color-only-variables`
- `--lookup-files "<glob>,<glob>"`
- `--lookup-file "<glob>"` (repeatable)
- `--ignore-globs "<glob>,<glob>"`
- `--ignore-glob "<glob>"` (repeatable)
- `--path-display=relative|absolute|abbreviated`
- `--path-display-length=N`
- `--undefined-var-fallback=warning|info|off`

Supported environment variables:

- `CSS_LSP_COLOR_ONLY_VARIABLES=1`
- `CSS_LSP_LOOKUP_FILES` (comma-separated globs)
- `CSS_LSP_IGNORE_GLOBS` (comma-separated globs)
- `CSS_LSP_DEBUG=1`
- `CSS_LSP_PATH_DISPLAY=relative|absolute|abbreviated`
- `CSS_LSP_PATH_DISPLAY_LENGTH=1`
- `CSS_LSP_UNDEFINED_VAR_FALLBACK=warning|info|off`

Defaults:

- `path-display`: `relative`
- `path-display-length`: `1`
- `undefined-var-fallback`: `warning`

### Completion Path Examples

Assume a variable is defined in `/Users/you/project/src/styles/theme.css` and your workspace root is `/Users/you/project`.

- `--path-display=relative` (default):
  - `Defined in src/styles/theme.css`
- `--path-display=absolute`:
  - `Defined in /Users/you/project/src/styles/theme.css`
- `--path-display=abbreviated --path-display-length=1`:
  - `Defined in s/s/theme.css`
- `--path-display=abbreviated --path-display-length=2`:
  - `Defined in sr/st/theme.css`
- `--path-display=abbreviated --path-display-length=0`:
  - `Defined in src/styles/theme.css`

## Development

### Prerequisites

- Node.js (v16+ recommended)
- npm
- (Optional) Rust toolchain if building the LSP from source

### Building

```bash
npm install

# Download Rust LSP binaries (optional, for testing Rust implementation)
npm run download-binaries

# Compile the extension
npm run compile
```

### Running

1. Open this project in VS Code
2. Press `F5` to launch the Extension Development Host
3. Open a folder containing CSS files

The extension will automatically detect whether Rust binaries are available and use the appropriate server.

### Platform-Specific Development

When developing on a specific platform, you can download only the binary for your platform:

```bash
# This downloads all platform binaries
node scripts/download-binaries.js

# Binaries are stored in bin/ directory
ls bin/
```

### Testing Different Implementations

To test with a specific server implementation:

```json
// Force TypeScript implementation
{
  "cssVariables.serverImplementation": "typescript"
}

// Force Rust implementation (requires binary)
{
  "cssVariables.serverImplementation": "rust"
}
```

## Troubleshooting

### Extension shows "No LSP server available"

This means neither the Rust nor TypeScript server could be found. Check:

1. The extension was built correctly (`npm run compile`)
2. For Rust: Binary exists at expected path (check Output panel > "CSS Variables")
3. For TypeScript: `dist/server.js` exists or `css-variable-lsp` npm package is installed

### Rust binary not found on supported platform

The extension will automatically fall back to TypeScript. To investigate:

1. Check the Output panel (View > Output > "CSS Variables")
2. Verify the binary exists: `ls bin/css-variable-lsp-*`
3. Try running manually: `./bin/css-variable-lsp-darwin-arm64 --version`

### Switching implementations

If you encounter issues with one implementation, force the other:

```json
{
  "cssVariables.serverImplementation": "typescript"
}
```

Then reload the window (Cmd+Shift+P > "Developer: Reload Window").

## Known Limitations

- Cascade resolution is best-effort; the LSP does not model DOM nesting or selector combinators.
- Rename operations replace full declarations/usages and may adjust formatting.
- Windows ARM64 support is experimental.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

GPL-3.0
