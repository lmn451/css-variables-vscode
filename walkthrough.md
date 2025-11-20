# CSS Variable Extension Verification

## Setup Verification

1. **Project Structure**
   - `src/extension.ts` exists (source code)
   - `out/extension.js` exists (compiled code)
   - `node_modules` contains `css-variable-lsp`

2. **Dependencies**
   - `vscode-languageclient` installed
   - `css-variable-lsp` installed

## How to Run

1. Open the project in VSCode.
2. Press `F5` to launch the **Extension Development Host**.
3. In the new window, open a folder containing CSS files.

## Verification Steps

### 1. Check Activation
- Open the "Output" panel (`Ctrl+Shift+U` / `Cmd+Shift+U`).
- Select "CSS Variable Language Server" from the dropdown.
- Verify you see startup logs.

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
- **Verify**:
  - Hover over `--main-color` to see the color preview.
  - Type `var(--` and check if `--main-color` appears in suggestions.
  - Cmd+Click (or Ctrl+Click) on `--main-color` to jump to definition.

### 3. Test Cross-File Support
- Create another file `theme.css` with variables.
- Verify they are available in `styles.css`.

### 4. Test JS/TS Support
- Create a `component.jsx` or `app.tsx` file.
- Add inline style or styled-component usage:
  ```jsx
  const style = {
    color: 'var(--main-color)'
  };
  ```
- Verify autocomplete and hover work for `var(--main-color)`.
