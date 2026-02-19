const assert = require('assert');
const {
  getFixtureUri,
  activateExtension,
  waitForLspReady,
  getDiagnostics,
  sleep,
} = require('./helpers.test');

describe('Diagnostics', function () {
  this.timeout(60000);

  before(async () => {
    await activateExtension();
  });

  it('warns about undefined variables', async function () {
    const docUri = getFixtureUri('definitions.css');
    await waitForLspReady(docUri);

    // Give server a moment to finish diagnostics
    await sleep(2000);

    const diagnostics = getDiagnostics(docUri);
    const undefinedVarWarning = diagnostics.find((d) =>
      d.message.includes('--does-not-exist'),
    );

    assert.ok(
      undefinedVarWarning,
      `Expected warning for --does-not-exist, but found: ${diagnostics
        .map((d) => d.message)
        .join(', ')}`,
    );
  });

  it('produces no diagnostics for clean usage', async function () {
    const docUri = getFixtureUri('usage.css');
    await waitForLspReady(docUri);

    await sleep(1000);

    const diagnostics = getDiagnostics(docUri);
    // Filter out potential project-wide unrelated diagnostics if any
    const localDiagnostics = diagnostics.filter(
      (d) => d.range.start.line < 100,
    );

    assert.strictEqual(
      localDiagnostics.length,
      0,
      `Expected 0 diagnostics in usage.css, but found: ${localDiagnostics
        .map((d) => d.message)
        .join(', ')}`,
    );
  });
});
