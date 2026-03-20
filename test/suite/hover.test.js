const vscode = require('vscode');
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
    const defDoc = await vscode.workspace.openTextDocument(
      getFixtureUri('definitions.css'),
    );
    await vscode.window.showTextDocument(defDoc);
    await waitForLspReady(docUri);
  });

  it('provides hover info for CSS variable usages', async () => {
    try {
      const hovers = await getHoverAt(docUri, 1, 19);

      assert.ok(
        hovers && hovers.length > 0,
        'Expected at least one hover result',
      );

      const allContents = hovers
        .flatMap((h) =>
          h.contents.map((c) => (typeof c === 'string' ? c : c.value || '')),
        )
        .join('\n');

      assert.ok(
        allContents.includes('#ff5733'),
        `Hover should contain value #ff5733, but got:\n${allContents}`,
      );
      // Hover shows "Defined in: :root" which indicates the definition location
      assert.ok(
        allContents.includes(':root') || allContents.includes('--primary-color'),
        `Hover should show variable name or definition location, but got:\n${allContents}`,
      );
    } catch (e) {
      throw e;
    }
  });
});
