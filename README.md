# CSS Variables (LSP) for VS Code

Project-wide CSS custom properties (variables) support for VS Code, powered by `css-variable-lsp`.

## Features

- Workspace indexing of CSS variables across `.css`, `.scss`, `.sass`, `.less`, and HTML `<style>` blocks / inline styles.
- Context-aware completion for `var(--...)` and CSS property values.
- Hover that shows cascade-ordered definitions (`!important`, specificity, source order).
- Go to definition and find references for CSS variables.
- Color decorations on `var(--...)` usages (the extension runs the LSP with `--color-only-variables`).
- Works in CSS, SCSS, Sass, Less, HTML, JavaScript/TypeScript (JSX/TSX), Svelte, Vue, Astro, and PostCSS.

## Installation

1. Open VS Code
2. Go to Extensions (Cmd+Shift+X or Ctrl+Shift+X)
3. Search for "CSS Variables (LSP)"
4. Click Install

The extension bundles `css-variable-lsp` and runs it inside VS Code's extension host. No additional Node.js or npm setup is required.

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

### Building

```bash
npm install
npm run compile
```

### Running

1. Open this project in VS Code
2. Press `F5` to launch the Extension Development Host
3. Open a folder containing CSS files

## Known Limitations

- Cascade resolution is best-effort; the LSP does not model DOM nesting or selector combinators.
- Rename operations replace full declarations/usages and may adjust formatting.
