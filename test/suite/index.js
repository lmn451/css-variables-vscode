const path = require('path');
const Mocha = require('mocha');
const glob = require('glob');

function run() {
  const mocha = new Mocha({ ui: 'bdd', color: true });
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

// Export for different module resolution strategies used by the test harness
module.exports = run;
module.exports.run = run;
module.exports.default = run;
