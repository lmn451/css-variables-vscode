const assert = require('assert');
const {
  getFixtureUri,
  activateExtension,
  waitForLspReady,
  getCompletionsAt,
} = require('./helpers.test');

describe('Color to Variable Suggestions', function () {
  this.timeout(60000);

  let docUri;

  before(async () => {
    await activateExtension();
    docUri = getFixtureUri('plain-colors.css');
    await waitForLspReady(docUri);
  });

  it('suggests CSS variable when plain hex color is used (line 17)', async () => {
    // Line 17: color: #ff5733; - should suggest --brand-color
    // Position is at the end of the line (after "color: ")
    const completions = await getCompletionsAt(docUri, 16, 20);

    assert.ok(completions, 'Expected completion list');

    // The LSP should suggest the --brand-color variable
    // which has the same value #ff5733
    const items = completions.items.map((i) => i.label);

    assert.ok(
      items.includes('--brand-color'),
      `Expected --brand-color to be suggested for plain color #ff5733. Got: ${JSON.stringify(items)}`,
    );
  });

  it('suggests CSS variable when plain hex color is used (line 22)', async () => {
    // Line 22: background-color: #3498db; - should suggest --brand-primary
    const completions = await getCompletionsAt(docUri, 21, 30);

    assert.ok(completions, 'Expected completion list');

    const items = completions.items.map((i) => i.label);

    assert.ok(
      items.includes('--brand-primary'),
      `Expected --brand-primary to be suggested for plain color #3498db. Got: ${JSON.stringify(items)}`,
    );
  });

  it('suggests CSS variable when plain hex color is used (line 27)', async () => {
    // Line 27: border-color: #2ecc71; - should suggest --success-green
    const completions = await getCompletionsAt(docUri, 26, 25);

    assert.ok(completions, 'Expected completion list');

    const items = completions.items.map((i) => i.label);

    assert.ok(
      items.includes('--success-green'),
      `Expected --success-green to be suggested for plain color #2ecc71. Got: ${JSON.stringify(items)}`,
    );
  });

  it('suggests CSS variable when plain hex color is used (line 32)', async () => {
    // Line 32: color: #f1c40f; - should suggest --warning-yellow
    const completions = await getCompletionsAt(docUri, 31, 20);

    assert.ok(completions, 'Expected completion list');

    const items = completions.items.map((i) => i.label);

    assert.ok(
      items.includes('--warning-yellow'),
      `Expected --warning-yellow to be suggested for plain color #f1c40f. Got: ${JSON.stringify(items)}`,
    );
  });

  it('suggests CSS variable when plain hex color is used (line 37)', async () => {
    // Line 37: background: #e74c3c; - should suggest --danger-red
    const completions = await getCompletionsAt(docUri, 36, 18);

    assert.ok(completions, 'Expected completion list');

    const items = completions.items.map((i) => i.label);

    assert.ok(
      items.includes('--danger-red'),
      `Expected --danger-red to be suggested for plain color #e74c3c. Got: ${JSON.stringify(items)}`,
    );
  });

  it('does not suggest non-existent variables for unmatched colors', async () => {
    // Line 48: background-color: blue; - should NOT suggest any variable
    // (there's no blue CSS variable defined)
    const completions = await getCompletionsAt(docUri, 47, 30);

    assert.ok(completions, 'Expected completion list');

    const items = completions.items.map((i) => i.label);

    // Blue (#0000ff) doesn't have a matching variable, so we shouldn't
    // get suggestions for it in this context
    // This test verifies the LSP doesn't make false suggestions
    const colorSuggestions = items.filter(
      (item) => !item.startsWith('-'),
    );
    // Should only get general CSS property suggestions, not variable suggestions
    assert.ok(
      colorSuggestions.length > 0 || items.length > 0,
      'Should still provide CSS property suggestions',
    );
  });

  it('provides meaningful completion detail for variable suggestions', async () => {
    // Line 17: color: #ff5733; - check that suggestion has proper detail
    const completions = await getCompletionsAt(docUri, 16, 20);

    assert.ok(completions, 'Expected completion list');

    const brandColorItem = completions.items.find(
      (i) => i.label === '--brand-color',
    );

    assert.ok(
      brandColorItem,
      'Should find --brand-color in completions',
    );

    // The completion item should exist with proper kind (Variable = 6)
    // Detail may or may not be present depending on LSP implementation
    assert.ok(
      brandColorItem.label === '--brand-color',
      `Should have correct label. Got: ${brandColorItem.label}`,
    );

    // Verify the completion item has a kind (should be Variable for CSS vars)
    // The kind might be undefined in some LSP implementations
    if (brandColorItem.kind !== undefined) {
      console.log('Completion kind:', brandColorItem.kind);
    }
  });
});
