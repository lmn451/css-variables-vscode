const path = require('path');
const { globSync } = require('glob');

async function run() {
  const { default: Mocha } = await import('mocha');
  const vscode = require('vscode');
  await vscode.workspace
    .getConfiguration('cssVariables')
    .update('serverImplementation', 'auto', vscode.ConfigurationTarget.Global);
  const mocha = new Mocha({ ui: 'bdd', color: true, timeout: 60000 });
  const testsRoot = path.resolve(__dirname);

  return new Promise((resolve, reject) => {
    try {
      const files = globSync('**/*.test.js', { cwd: testsRoot });
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

      mocha.run((failures) => {
        if (failures > 0) {
          return reject(new Error(`${failures} test(s) failed.`));
        }
        resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}
module.exports = run;
module.exports.run = run;
module.exports.default = run;
