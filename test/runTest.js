const path = require('path');
const { runTests } = require('@vscode/test-electron');

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '..');
    // Point to the suite entry file
    const minimum = process.argv.includes('--minimum');
    const extensionTestsPath = path.resolve(
      __dirname,
      'suite',
      minimum ? 'minimum' : 'index',
    );

    await runTests({
      version: minimum ? '1.91.0' : process.env.VSCODE_VERSION || 'stable',
      extensionDevelopmentPath,
      extensionTestsPath,
      // A short profile path avoids macOS's 103-character Unix socket limit.
      launchArgs: [
        path.resolve(__dirname, 'suite', 'fixtures'),
        '--user-data-dir',
        path.resolve(__dirname, '..', '.t'),
      ],
    });
  } catch (err) {
    console.error('Failed to run integration tests', err);
    process.exit(1);
  }
}

main();
