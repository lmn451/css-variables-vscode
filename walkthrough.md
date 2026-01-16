# CSS Variables (LSP) Extension Verification

## Setup Verification

1. **Project Structure**
   - `src/extension.ts` exists (source code)
   - `dist/extension.js` exists (compiled code)
   - `node_modules` contains `css-variable-lsp`

2. **Dependencies**
   - `vscode-languageclient` installed
   - `css-variable-lsp` installed

## How to Run

1. Open the project in VS Code.
2. Press `F5` to launch the Extension Development Host.
3. In the new window, open a folder containing CSS files.

## Verification Steps

### 1. Check Activation
- Open the Output panel (`Ctrl+Shift+U` / `Cmd+Shift+U`).
- Select "CSS Variables Language Server" from the dropdown.
- Verify you see startup logs and workspace scan messages.

### 2. Test CSS Variables
- Create a file named `styles.css`.
- Define a variable:
  ```css
  :root {
    --main-color: #ff0000;
  }
  ```
- Use the variable:
  ```css
  body {
    color: var(--main-color);
  }
  ```
- Verify:
  - Hover over `--main-color` to see cascade details.
  - Type `var(--` and confirm `--main-color` appears.
  - Cmd+Click (or Ctrl+Click) on `--main-color` to jump to definition.
  - Color decoration appears only on `var(--...)` usages.

### 3. Test Cross-File Support
- Create another file `theme.css` with variables.
- Verify they are available in `styles.css`.

### 4. Test HTML and JS/TS Support
- Create an `index.html` file with a `<style>` block or `style=""` attribute.
- Create a `component.jsx` or `app.tsx` file:
  ```jsx
  const style = {
    color: 'var(--main-color)'
  };
  ```
- Verify autocomplete and hover work for `var(--main-color)`.

### 5. Optional Settings Check
- In `settings.json`, set:
  ```json
  {
    "cssVariables.lookupFiles": ["**/*.css"],
    "cssVariables.blacklistFolders": ["**/dist/**"]
  }
  ```
- Restart the extension host and confirm the new settings apply.

