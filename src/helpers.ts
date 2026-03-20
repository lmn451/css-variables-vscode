/**
 * VS Code-dependent helpers and configuration utilities.
 * Re-exports utilities from utils.ts for convenience.
 */

import {
  workspace,
  ExtensionContext,
  FileSystemWatcher,
  OutputChannel,
} from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';
import * as path from 'path';
import * as fs from 'fs';
import {
  normalizeStringArray,
  normalizePathDisplay,
  normalizePathDisplayLength,
  normalizeUndefinedVarFallback,
  sanitizeRustServerEnv,
  buildServerArgs,
  DEFAULT_LOOKUP_FILES,
  DEFAULT_BLACKLIST_FOLDERS,
  LANGUAGE_IDS,
  type PathDisplayMode,
  type UndefinedVarFallbackMode,
} from './utils';
import {
  getBinaryPath,
  isPlatformSupported,
} from './platform';

export type { PathDisplayMode, UndefinedVarFallbackMode };
export {
  normalizeStringArray,
  normalizePathDisplay,
  normalizePathDisplayLength,
  normalizeUndefinedVarFallback,
  sanitizeRustServerEnv,
  DEFAULT_LOOKUP_FILES,
  DEFAULT_BLACKLIST_FOLDERS,
  LANGUAGE_IDS,
};

export type ServerImplementation = 'auto' | 'rust' | 'typescript';

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

export function readCssVariablesConfig(): CssVariablesConfig {
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

// Re-export buildServerArgs for extension.ts which imports from helpers
export { buildServerArgs } from './utils';

export function createFileWatchers(lookupFiles: string[]): FileSystemWatcher[] {
  const patterns = lookupFiles.length > 0 ? lookupFiles : DEFAULT_LOOKUP_FILES;
  const uniquePatterns = Array.from(
    new Set(patterns.map((pattern) => pattern.trim()).filter(Boolean)),
  );

  return uniquePatterns.map((pattern) => {
    const watcher = workspace.createFileSystemWatcher(pattern);
    return watcher;
  });
}

export function disposeFileWatchers(): void {
  // Implementation moved to extension.ts
}

function testBinary(binaryPath: string, outputChannel?: OutputChannel): boolean {
  try {
    const stats = fs.statSync(binaryPath);
    if (!stats.isFile()) {
      outputChannel?.appendLine(
        `[css-variables] Binary test failed: ${binaryPath} is not a file`,
      );
      return false;
    }

    if (process.platform !== 'win32') {
      const mode = stats.mode;
      const isExecutable = (mode & 0o111) !== 0;
      if (!isExecutable) {
        outputChannel?.appendLine(
          `[css-variables] Binary test failed: ${binaryPath} is not executable`,
        );
        return false;
      }
    }

    return true;
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    outputChannel?.appendLine(
      `[css-variables] Binary test failed for ${binaryPath}: ${errorMessage}`,
    );
    return false;
  }
}

function findTypeScriptServer(
  context: ExtensionContext,
  outputChannel?: OutputChannel,
): string | null {
  const bundledServer = context.asAbsolutePath(path.join('dist', 'server.js'));
  if (fs.existsSync(bundledServer)) {
    outputChannel?.appendLine(
      `[css-variables] Using bundled TypeScript server: ${bundledServer}`,
    );
    return bundledServer;
  }

  try {
    const resolved = require.resolve('css-variable-lsp/out/server.js');
    if (resolved && fs.existsSync(resolved)) {
      outputChannel?.appendLine(
        `[css-variables] Using TypeScript server from npm package: ${resolved}`,
      );
      return resolved;
    }
  } catch {
    // Package not installed
  }

  return null;
}

function findRustBinary(
  context: ExtensionContext,
  customPath?: string,
  outputChannel?: OutputChannel,
): string | null {
  if (customPath) {
    if (fs.existsSync(customPath)) {
      outputChannel?.appendLine(
        `[css-variables] Using custom Rust binary: ${customPath}`,
      );
      if (testBinary(customPath, outputChannel)) {
        return customPath;
      }
    } else {
      outputChannel?.appendLine(
        `[css-variables] Custom binary not found: ${customPath}`,
      );
    }
    return null;
  }

  if (!isPlatformSupported()) {
    outputChannel?.appendLine(
      `[css-variables] Platform not supported for Rust binary`,
    );
    return null;
  }

  try {
    const binaryPath = getBinaryPath(context.extensionPath);
    if (fs.existsSync(binaryPath)) {
      outputChannel?.appendLine(
        `[css-variables] Found bundled Rust binary: ${binaryPath}`,
      );
      if (testBinary(binaryPath, outputChannel)) {
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

export function determineServerOptions(
  context: ExtensionContext,
  config: CssVariablesConfig,
  args: string[],
  outputChannel?: OutputChannel,
): ServerOptions | null {
  const { serverImplementation, serverBinaryPath } = config;

  const tryRustFirst =
    serverImplementation === 'auto' || serverImplementation === 'rust';
  const tryTypescript =
    serverImplementation === 'auto' || serverImplementation === 'typescript';

  if (tryRustFirst) {
    const rustBinary = findRustBinary(context, serverBinaryPath || undefined, outputChannel);
    if (rustBinary) {
      const rustServerEnv = sanitizeRustServerEnv();
      outputChannel?.appendLine('[css-variables] Using Rust LSP server');
      return {
        run: {
          command: rustBinary,
          transport: TransportKind.stdio,
          args,
          options: { env: rustServerEnv },
        },
        debug: {
          command: rustBinary,
          transport: TransportKind.stdio,
          args,
          options: { env: rustServerEnv },
        },
      };
    }

    if (serverImplementation === 'rust') {
      outputChannel?.appendLine(
        '[css-variables] ERROR: Rust server requested but not available',
      );
      return null;
    }
  }

  if (tryTypescript) {
    const tsServer = findTypeScriptServer(context, outputChannel);
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

    if (serverImplementation === 'typescript') {
      outputChannel?.appendLine(
        '[css-variables] ERROR: TypeScript server requested but not available',
      );
      return null;
    }
  }

  outputChannel?.appendLine('[css-variables] ERROR: No LSP server available');
  return null;
}

export function createClient(
  context: ExtensionContext,
  outputChannel?: OutputChannel,
): LanguageClient | null {
  const config = readCssVariablesConfig();
  const args = buildServerArgs(config);

  const watchers = createFileWatchers(config.lookupFiles);

  for (const w of watchers) {
    context.subscriptions.push(w);
  }

  const serverOptions = determineServerOptions(context, config, args, outputChannel);
  if (!serverOptions) {
    return null;
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: LANGUAGE_IDS.map((language) => ({
      scheme: 'file',
      language,
    })),
    synchronize: {
      fileEvents: watchers,
    },
  };

  const lc = new LanguageClient(
    'cssVariableLsp',
    'CSS Variables Language Server',
    serverOptions,
    clientOptions,
  );

  context.subscriptions.push(lc);
  return lc;
}
