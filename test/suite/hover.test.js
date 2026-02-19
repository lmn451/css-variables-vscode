const assert = require('assert');
const {
  getFixtureUri,
  activateExtension,
  waitForLspReady,
  getHoverAt,
} = require('./helpers.test');

describe('Hover', function () {
  this.timeout(60000);

  let docUri;

  before(async () => {
    await activateExtension();
    docUri = getFixtureUri('usage.css');
    await waitForLspReady(docUri);
  });

  it('provides hover info for CSS variable usages', async () => {
    // .card { color: var(--primary-color|) }
    const hovers = await getHoverAt(docUri, 1, 19);

    assert.ok(
      hovers && hovers.length > 0,
      'Expected at least one hover result',
    );

    // Flatten all contents from all hover results
    const allContents = hovers
      .flatMap((h) =>
        h.contents.map((c) => (typeof c === 'string' ? c : c.value || '')),
      )
      .join('\n');

    assert.ok(
      allContents.includes('#ff5733'),
      `Hover should contain value #ff5733, but got:\n${allContents}`,
    );
    assert.ok(
      allContents.includes('definitions.css'),
      `Hover should mention the definition file, but got:\n${allContents}`,
    );
  });
});
