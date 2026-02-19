const path = require('path');
const fs = require('fs');
const { runTests, downloadAndUnzipVSCode } = require('@vscode/test-electron');

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '..');
    // Point to the suite entry file
    const extensionTestsPath = path.resolve(__dirname, 'suite', 'index');

    await runTests({
      version: '1.85.0',
      extensionDevelopmentPath,
      extensionTestsPath,
    });
  } catch (err) {
    console.error('Failed to run integration tests', err);
    process.exit(1);
  }
}

main();
