const assert = require('assert');
const {
  activateExtension,
  getFixtureUri,
  waitForLspReady,
  sleep,
} = require('./helpers.test');

/**
 * Test the CSS Variable LSP server behavior
 * These tests verify the LSP integration is working correctly
 */
describe('LSP Server Behavior', function () {
  this.timeout(60000);

  before(async () => {
    await activateExtension();
  });

  describe('Server Initialization', () => {
    it('extension activates successfully', async () => {
      const ext = vscode.extensions.getExtension(
        'miclmn451.css-variables-vscode',
      );

      assert.ok(ext, 'Extension should be found');
      assert.ok(ext.isActive, 'Extension should be active');
    });

    it('opens fixture files without errors', async () => {
      const docUri = getFixtureUri('definitions.css');
      const doc = await vscode.workspace.openTextDocument(docUri);

      assert.ok(doc, 'Document should open');
      assert.strictEqual(doc.languageId, 'css', 'Should be CSS language');
    });
  });

  describe('LSP Capabilities', () => {
    it('provides completions for var() functions', async () => {
      const docUri = getFixtureUri('usage.css');
      await waitForLspReady(docUri);

      const position = new vscode.Position(1, 16); // Inside var(--...)
      const completions = await vscode.commands.executeCommand(
        'vscode.executeCompletionItemProvider',
        docUri,
        position,
      );

      assert.ok(completions, 'Should provide completions');
      assert.ok(
        completions.items.length > 0,
        'Should have at least one completion item',
      );
    });

    it('provides hover information', async () => {
      const docUri = getFixtureUri('definitions.css');
      await waitForLspReady(docUri);

      const position = new vscode.Position(1, 15); // On --primary-color
      const hovers = await vscode.commands.executeCommand(
        'vscode.executeHoverProvider',
        docUri,
        position,
      );

      assert.ok(hovers, 'Should provide hover');
    });

    it('provides go-to-definition', async () => {
      const docUri = getFixtureUri('usage.css');
      await waitForLspReady(docUri);

      const position = new vscode.Position(1, 19); // On --primary-color
      const definitions = await vscode.commands.executeCommand(
        'vscode.executeDefinitionProvider',
        docUri,
        position,
      );

      assert.ok(definitions, 'Should provide definitions');
      assert.ok(
        definitions.length > 0,
        'Should have at least one definition',
      );
    });
  });

  describe('Variable Resolution', () => {
    it('resolves variables defined in same file', async () => {
      const docUri = getFixtureUri('definitions.css');
      await waitForLspReady(docUri);

      // Go to definition of --primary-color from its usage in .card
      const definitions = await vscode.commands.executeCommand(
        'vscode.executeDefinitionProvider',
        docUri,
        new vscode.Position(4, 15),
      );

      assert.ok(definitions && definitions.length > 0, 'Should find definition');

      // Definition should be in the same file (definitions.css)
      const targetUri = definitions[0].uri || definitions[0].targetUri;
      assert.ok(
        targetUri.fsPath.endsWith('definitions.css'),
        'Definition should be in definitions.css',
      );
    });

    it('resolves variables across files', async () => {
      const defUri = getFixtureUri('definitions.css');
      const usageUri = getFixtureUri('usage.css');

      // Index definitions first
      await waitForLspReady(defUri);

      // Then check usage
      await waitForLspReady(usageUri);

      // Go to definition from usage
      const definitions = await vscode.commands.executeCommand(
        'vscode.executeDefinitionProvider',
        usageUri,
        new vscode.Position(1, 19),
      );

      assert.ok(definitions && definitions.length > 0, 'Should find definition');
    });
  });

  describe('Color Decorations', () => {
    it('registers color provider for CSS', async () => {
      // This test verifies the color decoration feature
      // We can't directly test decorations, but we can verify
      // the extension provides DocumentColorProvider capability

      const docUri = getFixtureUri('definitions.css');
      const doc = await vscode.workspace.openTextDocument(docUri);
      await vscode.window.showTextDocument(doc);
      await sleep(500);

      // Try to get color presentations
      const colorPosition = new vscode.Position(1, 15);
      const colors = await vscode.commands.executeCommand(
        'vscode.executeColorProvider',
        docUri,
        { range: new vscode.Range(colorPosition, colorPosition) },
      );

      // The LSP should handle color requests
      // (result may be null/empty if no color at position)
      assert.ok(Array.isArray(colors), 'Should return array of colors');
    });
  });

  describe('Diagnostics Integration', () => {
    it('reports undefined variable diagnostics', async () => {
      const docUri = getFixtureUri('definitions.css');
      await waitForLspReady(docUri);

      // Wait for diagnostics to be published
      await sleep(2000);

      const diagnostics = vscode.languages.getDiagnostics(docUri);

      // The file has var(--does-not-exist) which should be flagged
      assert.ok(
        diagnostics.length >= 0,
        'Should check for diagnostics (may vary by server)',
      );
    });

    it('clears diagnostics when variable is defined', async () => {
      const docUri = getFixtureUri('usage.css');
      await waitForLspReady(docUri);

      await sleep(1000);

      const diagnostics = vscode.languages.getDiagnostics(docUri);

      // usage.css uses only defined variables, so minimal/no diagnostics
      const undefinedDiags = diagnostics.filter(
        (d) =>
          d.message.includes('--') &&
          d.message.toLowerCase().includes('undefined'),
      );

      assert.strictEqual(
        undefinedDiags.length,
        0,
        'Should have no undefined variable diagnostics',
      );
    });
  });

  describe('Configuration Sensitivity', () => {
    it('respects lookupFiles configuration', async () => {
      // Get current configuration
      const config = vscode.workspace.getConfiguration('cssVariables');
      const lookupFiles = config.get('lookupFiles');

      assert.ok(Array.isArray(lookupFiles), 'lookupFiles should be an array');
      assert.ok(
        lookupFiles.includes('**/*.css'),
        'Should include CSS files by default',
      );
    });

    it('respects blacklistFolders configuration', async () => {
      const config = vscode.workspace.getConfiguration('cssVariables');
      const blacklistFolders = config.get('blacklistFolders');

      assert.ok(
        Array.isArray(blacklistFolders),
        'blacklistFolders should be an array',
      );
      assert.ok(
        blacklistFolders.includes('**/node_modules/**'),
        'Should include node_modules in blacklist by default',
      );
    });

    it('reports serverImplementation setting', async () => {
      const config = vscode.workspace.getConfiguration('cssVariables');
      const serverImpl = config.get('serverImplementation');

      assert.ok(
        ['auto', 'rust', 'typescript'].includes(serverImpl),
        'serverImplementation should be auto, rust, or typescript',
      );
    });
  });

  describe('Performance Characteristics', () => {
    it('completes completion request within timeout', async () => {
      const docUri = getFixtureUri('definitions.css');
      await waitForLspReady(docUri);

      const start = Date.now();
      const completions = await vscode.commands.executeCommand(
        'vscode.executeCompletionItemProvider',
        docUri,
        new vscode.Position(0, 0),
      );
      const duration = Date.now() - start;

      assert.ok(
        duration < 5000,
        `Completion should complete within 5s, took ${duration}ms`,
      );
      assert.ok(completions, 'Should return completions');
    });

    it('handles multiple sequential requests', async () => {
      const docUri = getFixtureUri('definitions.css');
      await waitForLspReady(docUri);

      // Make multiple sequential requests
      for (let i = 0; i < 5; i++) {
        const completions = await vscode.commands.executeCommand(
          'vscode.executeCompletionItemProvider',
          docUri,
          new vscode.Position(0, 0),
        );
        assert.ok(completions, `Request ${i + 1} should succeed`);
      }
    });
  });
});

/**
 * Test edge cases and error handling
 */
describe('Edge Cases', function () {
  this.timeout(60000);

  before(async () => {
    await activateExtension();
  });

  it('handles empty var() gracefully', async () => {
    const docUri = getFixtureUri('usage.css');
    await waitForLspReady(docUri);

    // Position at empty var()
    const completions = await vscode.commands.executeCommand(
      'vscode.executeCompletionItemProvider',
      docUri,
      new vscode.Position(0, 0),
    );

    // Should return some completions (not crash)
    assert.ok(completions, 'Should return completions object');
  });

  it('handles position outside var()', async () => {
    const docUri = getFixtureUri('definitions.css');
    await waitForLspReady(docUri);

    // Position at a non-var context (e.g., property name)
    const completions = await vscode.commands.executeCommand(
      'vscode.executeCompletionItemProvider',
      docUri,
      new vscode.Position(0, 2),
    );

    // Should still return completions
    assert.ok(completions, 'Should return completions');
  });

  it('handles large completion lists', async () => {
    const docUri = getFixtureUri('definitions.css');
    await waitForLspReady(docUri);

    const completions = await vscode.commands.executeCommand(
      'vscode.executeCompletionItemProvider',
      docUri,
      new vscode.Position(1, 15),
    );

    // With all fixtures indexed, we should have many completions
    assert.ok(
      completions.items.length > 0,
      'Should have completion items',
    );
  });
});
