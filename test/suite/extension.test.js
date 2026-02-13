const assert = require('assert');
const vscode = require('vscode');

describe('Extension Activation', function () {
  this.timeout(60000);

  it('activates extension', async () => {
    const ext = vscode.extensions.getExtension('miclmn451.css-variables-vscode');
    assert.ok(ext, 'Extension not found');
    await ext.activate();
    assert.ok(ext.isActive, 'Extension is not active after activation');
  });
});
