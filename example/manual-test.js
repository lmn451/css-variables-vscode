/**
 * Manual Test for Color to Variable Suggestions
 * =============================================
 * 
 * This script can be used to manually test the new feature.
 * Run it with: node manual-test.js
 * 
 * It will show you the exact scenarios where the feature should trigger.
 */

const colors = [
  { hex: '#ff5733', variable: '--brand-color', context: 'background-color: #ff5733;' },
  { hex: '#3498db', variable: '--primary', context: 'color: #3498db;' },
  { hex: '#2ecc71', variable: '--success', context: 'border: 1px solid #2ecc71;' },
  { hex: '#e74c3c', variable: '--danger', context: 'color: #e74c3c;' },
  { hex: '#f1c40f', variable: '--warning', context: 'background: #f1c40f;' },
];

console.log('Color to Variable Suggestion Feature Test\n');
console.log('==========================================\n');
console.log('Test Scenarios:\n');

colors.forEach((color, index) => {
  console.log(`${index + 1}. ${color.context}`);
  console.log(`   Expected suggestion: ${color.variable} (${color.hex})\n`);
});

console.log('\nHow to Test Manually:\n');
console.log('1. Open the VS Code extension development host');
console.log('2. Open a CSS/SCSS/LESS file containing color variable definitions');
console.log('3. In the same or another file, type a plain color value');
console.log('4. Position your cursor where the color value is');
console.log('5. Trigger completions (Ctrl+Space or Cmd+Space)');
console.log('6. You should see the matching CSS variable suggested\n');

console.log('Example Test File:');
console.log('  Open: example/plain-color-example.css');
console.log('  Then try typing or modifying the color values\n');

console.log('Expected Behavior:');
console.log('  - When you type a hex color like #ff5733');
console.log('  - And there exists a CSS variable with that exact value');
console.log('  - The LSP will suggest using the variable instead');
console.log('  - This helps maintain consistency and makes refactoring easier\n');

console.log('Feature Benefits:');
console.log('  ✓ Promotes use of CSS variables for maintainability');
console.log('  ✓ Helps enforce consistent color usage across the codebase');
console.log('  ✓ Easy migration path from hardcoded colors to variables');
console.log('  ✓ Works across all CSS preprocessors (SCSS, LESS, etc.)');
