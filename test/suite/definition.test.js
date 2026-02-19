const assert = require('assert');
const {
  getFixtureUri,
  activateExtension,
  waitForLspReady,
  getDefinitionsAt,
} = require('./helpers.test');

describe('Definition', function () {
  this.timeout(60000);

  let docUri;

  before(async () => {
    await activateExtension();
    docUri = getFixtureUri('usage.css');
    await waitForLspReady(docUri);
  });

  it('jumps to variable definition', async () => {
    // .card { color: var(--primary-color|) }
    const definitions = await getDefinitionsAt(docUri, 1, 19);

    assert.ok(
      definitions && definitions.length > 0,
      'Expected at least one definition result',
    );

    const targetPos = definitions[0].uri || definitions[0].targetUri;
    const targetRange = definitions[0].range || definitions[0].targetRange;

    assert.ok(
      targetPos.fsPath.endsWith('definitions.css'),
      `Target file should be definitions.css, but got: ${targetPos.fsPath}`,
    );
    // --primary-color is on line 1 in definitions.css (0-indexed)
    assert.strictEqual(
      targetRange.start.line,
      1,
      `Expected target line 1, but got ${targetRange.start.line}`,
    );
  });
});
