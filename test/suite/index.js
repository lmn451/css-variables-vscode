const path = require('path');
const Mocha = require('mocha');
const glob = require('glob');

function run() {
  const mocha = new Mocha({ ui: 'bdd', color: true, timeout: 60000 });
  const testsRoot = path.resolve(__dirname);

  return new Promise((resolve, reject) => {
    try {
      const files = glob.sync('**/*.test.js', { cwd: testsRoot });
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
