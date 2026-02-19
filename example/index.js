// Simple example demonstrating a usage of a CSS variable in inline styles.
// Use this file to verify the extension can pick up `var(--primary)` in JS files.
const Example = () => {
  return '<div style="color: var(--secondary);">example</div>';
};

module.exports = { Example };
