const vscode = require('vscode');
const path = require('path');

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

/**
 * Get a URI for a fixture file.
 */
function getFixtureUri(filename) {
  return vscode.Uri.file(path.join(FIXTURES_DIR, filename));
}

/**
 * Activate the extension and return it.
 */
async function activateExtension() {
  const ext = vscode.extensions.getExtension('miclmn451.css-variables-vscode');
  if (!ext) {
    throw new Error('Extension not found');
  }
  if (!ext.isActive) {
    await ext.activate();
  }
  return ext;
}

/**
 * Open a document and wait for the LSP server to be ready.
 * We detect readiness by waiting for diagnostics to appear or a timeout.
 */
async function waitForLspReady(docUri, maxWait = 30000) {
  const doc = await vscode.workspace.openTextDocument(docUri);
  await vscode.window.showTextDocument(doc);

  // Wait for the LSP to kick in — poll for diagnostics or a steady state
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    // Give the server a moment
    await sleep(500);

    // Try to get completions at position 0,0 — if we get a result, LSP is warm
    try {
      const completions = await vscode.commands.executeCommand(
        'vscode.executeCompletionItemProvider',
        docUri,
        new vscode.Position(0, 0),
      );
      if (completions && completions.items && completions.items.length >= 0) {
        // LSP responded — wait a bit more for full indexing
        await sleep(1000);
        return doc;
      }
    } catch {
      // LSP not ready yet, keep waiting
    }
  }

  // Return the doc even if we timed out — tests will fail with better messages
  return doc;
}

/**
 * Get completions at a position in a document.
 */
async function getCompletionsAt(docUri, line, character) {
  const position = new vscode.Position(line, character);
  const result = await vscode.commands.executeCommand(
    'vscode.executeCompletionItemProvider',
    docUri,
    position,
  );
  return result;
}

/**
 * Get hover information at a position in a document.
 */
async function getHoverAt(docUri, line, character) {
  const position = new vscode.Position(line, character);
  const result = await vscode.commands.executeCommand(
    'vscode.executeHoverProvider',
    docUri,
    position,
  );
  return result;
}

/**
 * Get go-to-definition results at a position in a document.
 */
async function getDefinitionsAt(docUri, line, character) {
  const position = new vscode.Position(line, character);
  const result = await vscode.commands.executeCommand(
    'vscode.executeDefinitionProvider',
    docUri,
    position,
  );
  return result;
}

/**
 * Get diagnostics for a URI.
 */
function getDiagnostics(docUri) {
  return vscode.languages.getDiagnostics(docUri);
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  FIXTURES_DIR,
  getFixtureUri,
  activateExtension,
  waitForLspReady,
  getCompletionsAt,
  getHoverAt,
  getDefinitionsAt,
  getDiagnostics,
  sleep,
};
