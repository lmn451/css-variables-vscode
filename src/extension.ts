import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';
import {
  workspace,
  ExtensionContext,
  FileSystemWatcher,
  window,
  OutputChannel,
} from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';
import {
  normalizeStringArray,
  normalizePathDisplay,
  normalizePathDisplayLength,
  normalizeUndefinedVarFallback,
} from './helpers';
import {
  getBinaryPath,
  isPlatformSupported,
  getPlatformIdentifier,
} from './platform';

const execAsync = promisify(exec);

const DEFAULT_LOOKUP_FILES = [
  '**/*.less',
  '**/*.scss',
  '**/*.sass',
  '**/*.css',
  '**/*.html',
  '**/*.vue',
  '**/*.svelte',
  '**/*.astro',
  '**/*.ripple',
];

const DEFAULT_BLACKLIST_FOLDERS = [
  '**/.cache/**',
  '**/.DS_Store',
  '**/.git/**',
  '**/.hg/**',
  '**/.next/**',
  '**/.svn/**',
  '**/bower_components/**',
  '**/CVS/**',
  '**/dist/**',
  '**/node_modules/**',
  '**/tests/**',
  '**/tmp/**',
];

const LANGUAGE_IDS = [
  'css',
  'scss',
  'sass',
  'less',
  'html',
  'javascript',
  'typescript',
  'javascriptreact',
  'typescriptreact',
  'vue',
  'svelte',
  'astro',
  'postcss',
  'ripple',
];

type PathDisplayMode = 'relative' | 'absolute' | 'abbreviated';
type UndefinedVarFallbackMode = 'warning' | 'info' | 'off';
type ServerImplementation = 'auto' | 'rust' | 'typescript';

type CssVariablesConfig = {
  lookupFiles: string[];
  blacklistFolders: string[];
  colorOnlyVariables: boolean;
  noColorPreview: boolean;
  pathDisplay?: PathDisplayMode;
  pathDisplayLength?: number;
  undefinedVarFallback?: UndefinedVarFallbackMode;
  serverImplementation: ServerImplementation;
  serverBinaryPath: string;
};

let client: LanguageClient | undefined;
let restartChain = Promise.resolve();
let fileWatchers: FileSystemWatcher[] = [];
let active = false;
let outputChannel: OutputChannel | undefined;
let configChangeTimer: NodeJS.Timeout | undefined;
let fileEventTimer: NodeJS.Timeout | undefined;
let pendingFileEvents: Array<string> = [];

function readCssVariablesConfig(): CssVariablesConfig {
  const config = workspace.getConfiguration('cssVariables');
  const lookupFiles = normalizeStringArray(
    config.get('lookupFiles'),
    DEFAULT_LOOKUP_FILES,
  );
  const blacklistFolders = normalizeStringArray(
    config.get('blacklistFolders'),
    DEFAULT_BLACKLIST_FOLDERS,
  );
  const colorOnlyVariables = config.get<boolean>('colorOnlyVariables', true);
  const noColorPreview = config.get<boolean>('noColorPreview', false);
  const pathDisplay = normalizePathDisplay(config.get('pathDisplay'));
  const pathDisplayLength = normalizePathDisplayLength(
    config.get('pathDisplayLength'),
  );
  const undefinedVarFallback = normalizeUndefinedVarFallback(
    config.get('undefinedVarFallback'),
  );
  const serverImplementation = config.get<ServerImplementation>(
    'serverImplementation',
    'auto',
  );
  const serverBinaryPath = config.get<string>('serverBinaryPath', '');

  return {
    lookupFiles,
    blacklistFolders,
    colorOnlyVariables,
    noColorPreview,
    pathDisplay,
    pathDisplayLength,
    undefinedVarFallback,
    serverImplementation,
    serverBinaryPath,
  };
}

function buildServerArgs(config: CssVariablesConfig): string[] {
  const args: string[] = [];

  if (config.noColorPreview) {
    args.push('--no-color-preview');
  } else if (config.colorOnlyVariables) {
    args.push('--color-only-variables');
  }

  for (const glob of config.lookupFiles) {
    args.push('--lookup-file', glob);
  }

  for (const glob of config.blacklistFolders) {
    args.push('--ignore-glob', glob);
  }

  if (config.pathDisplay) {
    args.push('--path-display', config.pathDisplay);
  }

  if (config.pathDisplayLength !== undefined) {
    args.push('--path-display-length', String(config.pathDisplayLength));
  }

  if (config.undefinedVarFallback) {
    args.push('--undefined-var-fallback', config.undefinedVarFallback);
  }

  return args;
}

function createFileWatchers(
  lookupFiles: string[],
  context: ExtensionContext,
): FileSystemWatcher[] {
  const patterns = lookupFiles.length > 0 ? lookupFiles : DEFAULT_LOOKUP_FILES;
  const uniquePatterns = Array.from(
    new Set(patterns.map((pattern) => pattern.trim()).filter(Boolean)),
  );

  function scheduleFileEvents() {
    if (fileEventTimer) {
      clearTimeout(fileEventTimer);
    }
    fileEventTimer = setTimeout(() => {
      const events = pendingFileEvents.slice();
      pendingFileEvents = [];
      outputChannel?.appendLine(
        `[css-variables] File events: ${events.join(',')}`,
      );
      // Debounced restart to avoid thrashing on many fs events
      void restartClient(context);
    }, 300);
  }

  return uniquePatterns.map((pattern) => {
    const watcher = workspace.createFileSystemWatcher(pattern);
    const pushEvent = (type: string) => () => {
      pendingFileEvents.push(`${type}:${pattern}`);
      scheduleFileEvents();
    };
    watcher.onDidChange(pushEvent('change'));
    watcher.onDidCreate(pushEvent('create'));
    watcher.onDidDelete(pushEvent('delete'));
    return watcher;
  });
}

function disposeFileWatchers() {
  for (const watcher of fileWatchers) {
    watcher.dispose();
  }
  fileWatchers = [];
}

/**
 * Test if a binary is executable and working
 */
async function testBinary(binaryPath: string): Promise<boolean> {
  try {
    // Try to run the binary with --version flag
    const { stdout } = await execAsync(`"${binaryPath}" --version`, {
      timeout: 5000,
    });
    outputChannel?.appendLine(
      `[css-variables] Binary test successful: ${stdout.trim()}`,
    );
    return true;
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    outputChannel?.appendLine(
      `[css-variables] Binary test failed for ${binaryPath}: ${errorMessage}`,
    );
    return false;
  }
}

/**
 * Find the TypeScript server module path
 */
function findTypeScriptServer(context: ExtensionContext): string | null {
  // First try the bundled server
  const bundledServer = context.asAbsolutePath(path.join('dist', 'server.js'));
  if (fs.existsSync(bundledServer)) {
    outputChannel?.appendLine(
      `[css-variables] Using bundled TypeScript server: ${bundledServer}`,
    );
    return bundledServer;
  }

  // Try to resolve from npm package
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const resolved = require.resolve('css-variable-lsp/out/server.js');
    if (resolved && fs.existsSync(resolved)) {
      outputChannel?.appendLine(
        `[css-variables] Using TypeScript server from npm package: ${resolved}`,
      );
      return resolved;
    }
  } catch (e) {
    // Package not installed
  }

  return null;
}

/**
 * Find the Rust binary path
 */
async function findRustBinary(
  context: ExtensionContext,
  customPath?: string,
): Promise<string | null> {
  // If custom path is provided, try that first
  if (customPath) {
    if (fs.existsSync(customPath)) {
      outputChannel?.appendLine(
        `[css-variables] Using custom Rust binary: ${customPath}`,
      );
      if (await testBinary(customPath)) {
        return customPath;
      }
    } else {
      outputChannel?.appendLine(
        `[css-variables] Custom binary not found: ${customPath}`,
      );
    }
    return null;
  }

  // Check if platform is supported
  if (!isPlatformSupported()) {
    outputChannel?.appendLine(
      `[css-variables] Platform not supported for Rust binary: ${getPlatformIdentifier()}`,
    );
    return null;
  }

  // Try to find bundled binary
  try {
    const binaryPath = getBinaryPath(context.extensionPath);
    if (fs.existsSync(binaryPath)) {
      outputChannel?.appendLine(
        `[css-variables] Found bundled Rust binary: ${binaryPath}`,
      );
      if (await testBinary(binaryPath)) {
        return binaryPath;
      }
    } else {
      outputChannel?.appendLine(
        `[css-variables] Bundled Rust binary not found: ${binaryPath}`,
      );
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    outputChannel?.appendLine(
      `[css-variables] Error finding Rust binary: ${errorMessage}`,
    );
  }

  return null;
}

/**
 * Determine which server to use based on configuration
 */
async function determineServerOptions(
  context: ExtensionContext,
  config: CssVariablesConfig,
  args: string[],
): Promise<ServerOptions | null> {
  const { serverImplementation, serverBinaryPath } = config;

  // Determine which implementations to try based on setting
  const tryRustFirst =
    serverImplementation === 'auto' || serverImplementation === 'rust';
  const tryTypescript =
    serverImplementation === 'auto' || serverImplementation === 'typescript';

  // Try Rust first (if enabled)
  if (tryRustFirst) {
    const rustBinary = await findRustBinary(
      context,
      serverBinaryPath || undefined,
    );
    if (rustBinary) {
      outputChannel?.appendLine('[css-variables] Using Rust LSP server');
      return {
        run: { command: rustBinary, transport: TransportKind.stdio, args },
        debug: { command: rustBinary, transport: TransportKind.stdio, args },
      };
    }

    // If rust was specifically requested but not found, don't fallback
    if (serverImplementation === 'rust') {
      outputChannel?.appendLine(
        '[css-variables] ERROR: Rust server requested but not available',
      );
      void window.showErrorMessage(
        'CSS Variables: Rust LSP server not found. Please check your serverBinaryPath setting or install the Rust binary.',
      );
      return null;
    }
  }

  // Fallback to TypeScript (if enabled)
  if (tryTypescript) {
    const tsServer = findTypeScriptServer(context);
    if (tsServer) {
      outputChannel?.appendLine(
        '[css-variables] Using TypeScript LSP server (fallback)',
      );
      return {
        run: { module: tsServer, transport: TransportKind.ipc, args },
        debug: {
          module: tsServer,
          transport: TransportKind.ipc,
          args,
          options: { execArgv: ['--nolazy', '--inspect=6009'] },
        },
      };
    }

    // If typescript was specifically requested but not found
    if (serverImplementation === 'typescript') {
      outputChannel?.appendLine(
        '[css-variables] ERROR: TypeScript server requested but not available',
      );
      void window.showErrorMessage(
        'CSS Variables: TypeScript LSP server not found. Please reinstall the extension.',
      );
      return null;
    }
  }

  // Nothing worked
  outputChannel?.appendLine('[css-variables] ERROR: No LSP server available');
  void window.showErrorMessage(
    'CSS Variables: No LSP server available. The extension may not work correctly.',
  );
  return null;
}

async function createClient(
  context: ExtensionContext,
): Promise<LanguageClient | null> {
  const config = readCssVariablesConfig();
  const args = buildServerArgs(config);

  disposeFileWatchers();
  fileWatchers = createFileWatchers(config.lookupFiles, context);

  // register watchers so they are disposed automatically when the extension
  // context is disposed. We still keep `fileWatchers` for manual control.
  for (const w of fileWatchers) {
    context.subscriptions.push(w);
  }

  const serverOptions = await determineServerOptions(context, config, args);
  if (!serverOptions) {
    return null;
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: LANGUAGE_IDS.map((language) => ({
      scheme: 'file',
      language,
    })),
    synchronize: {
      fileEvents: fileWatchers,
    },
  };

  const lc = new LanguageClient(
    'cssVariableLsp',
    'CSS Variables Language Server',
    serverOptions,
    clientOptions,
  );

  // ensure the language client is disposed when the extension is deactivated
  context.subscriptions.push(lc);
  return lc;
}

async function restartClient(context: ExtensionContext) {
  // avoid scheduling restarts after the extension has been deactivated
  if (!active) {
    return restartChain;
  }

  restartChain = restartChain.then(async () => {
    try {
      if (client) {
        await client.stop();
      }
      const newClient = await createClient(context);
      if (newClient) {
        client = newClient;
        await client.start();
      }
    } catch (error) {
      outputChannel?.appendLine(
        '[css-variables] Failed to restart language client: ' + String(error),
      );
      console.error('[css-variables] Failed to restart language client', error);
    }
  });
  return restartChain;
}

export async function activate(context: ExtensionContext) {
  active = true;

  outputChannel = window.createOutputChannel('CSS Variables');
  context.subscriptions.push(outputChannel);

  outputChannel?.appendLine(`[css-variables] Activating extension...`);
  outputChannel?.appendLine(
    `[css-variables] Platform: ${getPlatformIdentifier()}`,
  );

  const newClient = await createClient(context);
  if (newClient) {
    client = newClient;
    void client.start().catch((err) => {
      outputChannel?.appendLine(
        '[css-variables] Failed to start language client: ' + String(err),
      );
      console.error('[css-variables] Failed to start language client', err);
    });
  } else {
    outputChannel?.appendLine(
      '[css-variables] Failed to create language client',
    );
  }

  context.subscriptions.push(
    workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('cssVariables')) {
        if (configChangeTimer) clearTimeout(configChangeTimer);
        configChangeTimer = setTimeout(() => void restartClient(context), 250);
      }
    }),
  );
}

export function deactivate(): Thenable<void> | undefined {
  active = false;
  // reset pending restart chain to avoid further restarts
  restartChain = Promise.resolve();

  disposeFileWatchers();

  if (!client) {
    return undefined;
  }
  return client.stop();
}
