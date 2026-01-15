# CSS Variable - VSCode Extension

Intelligent CSS variable support with cross-file completion, hover information, and context-aware CSS cascade resolution.

## Features

- **✨ Cross-File Completion**: Get autocomplete suggestions for CSS variables defined anywhere in your workspace
- **🔍 Hover Information**: See variable values and their definitions on hover, with full CSS cascade order
- **🎯 Go to Definition**: Jump directly to where a CSS variable is defined
- **📊 Context-Aware Resolution**: Understands CSS specificity and shows which variable value actually applies
- **🌐 Multi-Language Support**: Works with:
  - CSS (`.css`)
  - Preprocessors (`.scss`, `.sass`, `.less`)
  - HTML (`.html`)
  - JavaScript/TypeScript (`.js`, `.ts`, `.jsx`, `.tsx`)
  - Component Frameworks (`.vue`, `.svelte`, `.astro`, PostCSS)
- **🎨 Color Decorations**: Color previews for CSS variables used in `var(--...)` expressions
- **⚡ Real-Time Updates**: Automatically detects changes across all supported files in your workspace

## Installation

### Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the extension:
   ```bash
   npm run compile
   ```
4. Press `F5` in VSCode to launch the Extension Development Host

## Usage

The extension activates automatically when you open any supported file type.

### Example: Cross-File Variables

**`theme.css`:**
```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
}
```

**`component.css`:**
```css
.button {
  background: var(--primary-color); /* Auto-complete works! */
  border-color: var(--secondary-color);
}
```

**`App.jsx`:**
```jsx
const styles = {
  color: 'var(--primary-color)' // Works in JS/TS too!
};
```

### Example: Context-Specific Resolution

When you hover over a CSS variable, the extension shows the complete CSS cascade:

```css
:root {
  --color: red;
}
div {
  --color: blue;
}
.special {
  --color: green !important;
}
```

Hovering over `var(--color)` in `div.special` context shows:

```
1. green from .special (0,1,0) !important ✓ Wins
2. blue from div (0,0,1) (overridden by !important)
3. red from :root (0,1,0) (lower specificity)
```

## Configuration

You can customize the extension behavior through VSCode settings. Open Settings (Cmd+, or Ctrl+,) and search for "cssVariableLsp".

### Available Settings

- `cssVariableLsp.maxNumberOfProblems` (default: `100`)
  - Controls the maximum number of problems produced by the server.

- `cssVariableLsp.lookupFiles` (default: `["**/*.less", "**/*.scss", "**/*.sass", "**/*.css", "**/*.html", "**/*.vue", "**/*.svelte", "**/*.astro", "**/*.ripple"]`)
  - Glob patterns for files to scan for CSS variables.
  - You can add or remove patterns to control which files are indexed.

- `cssVariableLsp.blacklistFolders` (default: `["**/.cache/**", "**/.DS_Store", "**/.git/**", "**/.hg/**", "**/.next/**", "**/.svn/**", "**/bower_components/**", "**/CVS/**", "**/dist/**", "**/node_modules/**", "**/tests/**", "**/tmp/**"]`)
  - Glob patterns for folders to exclude from CSS variable indexing.
  - Add patterns for folders you want to exclude from variable indexing.

### Example Configuration

To scan only CSS and Vue files and exclude a custom folder:

```json
{
  "cssVariableLsp.lookupFiles": [
    "**/*.css",
    "**/*.vue"
  ],
  "cssVariableLsp.blacklistFolders": [
    "**/dist/**",
    "**/node_modules/**",
    "**/my-custom-folder/**"
  ]
}
```

### Workspace-Specific Settings

You can also configure these settings at the workspace level by creating or editing `.vscode/settings.json` in your project:

```json
{
  "cssVariableLsp.lookupFiles": [
    "**/*.css",
    "**/*.scss",
    "**/*.vue"
  ],
  "cssVariableLsp.blacklistFolders": [
    "**/node_modules/**",
    "**/dist/**"
  ]
}
```

## Features in Detail

### Cross-File Variable Tracking

The language server indexes all CSS variables across your workspace, including:

- Standard CSS files (`.css`)
- Preprocessor files (`.scss`, `.sass`, `.less`)
- HTML files (`.html`)
- Component frameworks (`.vue`, `.svelte`, `.astro`)
- JavaScript/TypeScript files (`.js`, `.ts`, `.jsx`, `.tsx`)

### CSS Cascade Intelligence

The server understands CSS specificity rules:
- Calculates selector specificity (IDs, classes, elements)
- Respects `!important` declarations
- Considers inline styles
- Tracks source order for equal specificity

### HTML DOM Awareness

Parses HTML structure to provide context-specific variable resolution based on the DOM tree and CSS selectors.

## License

MIT
