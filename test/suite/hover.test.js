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
      require('fs').writeFileSync(
        '/Users/applesucks/dev/css-variables-vscode/hover-rescue.log',
        `[HOVERS RAW JSON]\n${JSON.stringify(hovers, null, 2)}\n\n[LENGTH]\n${
          hovers ? hovers.length : 'undefined/null'
        }`,
      );

      assert.ok(
        hovers && hovers.length > 0,
        'Expected at least one hover result',
      );

      const allContents = hovers
        .flatMap((h) =>
          h.contents.map((c) => (typeof c === 'string' ? c : c.value || '')),
        )
        .join('\n');

      require('fs').appendFileSync(
        '/Users/applesucks/dev/css-variables-vscode/hover-rescue.log',
        `\n[ALL CONTENTS]\n${allContents}`,
      );

      assert.ok(
        allContents.includes('#ff5733'),
        `Hover should contain value #ff5733, but got:\n${allContents}`,
      );
      assert.ok(
        allContents.includes('definitions.css'),
        `Hover should mention the definition file, but got:\n${allContents}`,
      );
    } catch (e) {
      require('fs').appendFileSync(
        '/Users/applesucks/dev/css-variables-vscode/hover-rescue.log',
        `\n[ERROR]\n${e.stack || e.message}`,
      );
      throw e;
    }
  });
});
