const assert = require('assert');
const {
  getFixtureUri,
  activateExtension,
  waitForLspReady,
  getCompletionsAt,
} = require('./helpers.test');

describe('Completions', function () {
  this.timeout(60000);

  let docUri;

  before(async () => {
    await activateExtension();
    docUri = getFixtureUri('usage.css');
    await waitForLspReady(docUri);
  });

  it('provides completions for CSS variables', async () => {
    // .card { color: var(| }
    const completions = await getCompletionsAt(docUri, 1, 16);

    assert.ok(completions, 'Expected completion list');
    const items = completions.items.map((i) => i.label);

    assert.ok(
      items.includes('--primary-color'),
      'Should include --primary-color',
    );
    assert.ok(items.includes('--spacing-sm'), 'Should include --spacing-sm');
    assert.ok(items.includes('--font-family'), 'Should include --font-family');
  });

  it('provides variable values in completion details', async () => {
    const completions = await getCompletionsAt(docUri, 1, 16);
    const primary = completions.items.find(
      (i) => i.label === '--primary-color',
    );

    assert.ok(primary, 'Found --primary-color completion');
    // The exact formatting depends on the server (Rust vs TS)
    // but both should include the value #ff5733
    const detail = primary.detail || '';
    assert.ok(
      detail.includes('#ff5733'),
      `Detail should contain value #ff5733, but got: ${detail}`,
    );
  });
});
