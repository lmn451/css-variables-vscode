const path = require('path');
const { runTests, downloadAndUnzipVSCode } = require('@vscode/test-electron');

async function main() {
  try {
    const vscodeExecutablePath = await downloadAndUnzipVSCode();

    const extensionDevelopmentPath = path.resolve(__dirname, '..');
    // Point to the suite directory; the harness will resolve the entry module.
    const extensionTestsPath = path.resolve(__dirname, 'suite');

    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath,
    });
  } catch (err) {
    console.error('Failed to run integration tests', err);
    process.exit(1);
  }
}

main();
