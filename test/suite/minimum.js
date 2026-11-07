const assert = require('node:assert/strict');
const path = require('node:path');
const vscode = require('vscode');

async function eventually(read, accepts, description) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const result = await read();
    if (accepts(result)) return result;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.fail(`Timed out waiting for ${description}`);
}

async function run() {
  console.log(
    `Minimum host: VS Code ${vscode.version}, Node ${process.versions.node}`,
  );
  // Exercise the published, bundled TypeScript server even if Rust is installed.
  await vscode.workspace
    .getConfiguration('cssVariables')
    .update(
      'serverImplementation',
      'typescript',
      vscode.ConfigurationTarget.Global,
    );
  const extension = vscode.extensions.getExtension(
    'miclmn451.css-variables-vscode',
  );
  assert.ok(extension, 'Extension is registered');
  await extension.activate();
  assert.ok(extension.isActive, 'Extension activates');

  const uri = vscode.Uri.file(path.join(__dirname, 'fixtures', 'usage.css'));
  const document = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(document);
  const position = new vscode.Position(1, 19);
  const complete = () =>
    vscode.commands.executeCommand(
      'vscode.executeCompletionItemProvider',
      uri,
      new vscode.Position(1, 16),
    );
  await eventually(
    complete,
    (result) =>
      result?.items.some(
        (item) =>
          (typeof item.label === 'string' ? item.label : item.label.label) ===
          '--primary-color',
      ),
    'CSS server completions',
  );
  const hovers = await eventually(
    () =>
      vscode.commands.executeCommand(
        'vscode.executeHoverProvider',
        uri,
        position,
      ),
    (result) =>
      result?.some((hover) =>
        hover.contents.some((content) =>
          String(
            typeof content === 'string' ? content : content.value,
          ).includes('#ff5733'),
        ),
      ),
    'CSS variable hover value',
  );
  assert.ok(hovers.length);
  await eventually(
    () =>
      vscode.commands.executeCommand(
        'vscode.executeDefinitionProvider',
        uri,
        position,
      ),
    (result) =>
      result?.some((definition) =>
        (definition.uri || definition.targetUri).fsPath.endsWith(
          'definitions.css',
        ),
      ),
    'CSS variable definition',
  );

  // Call the actual entry point's deactivation to verify the client stop promise.
  const entry = require(
    path.join(extension.extensionPath, 'dist', 'extension.js'),
  );
  await entry.deactivate();
  console.log(
    'Minimum host activation, completion, hover, definition and shutdown passed',
  );
}

module.exports = { run };
