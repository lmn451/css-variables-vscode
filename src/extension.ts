import {
  workspace,
  ExtensionContext,
  FileSystemWatcher,
  window,
  OutputChannel,
} from 'vscode';
import {
  LanguageClient,
  State,
} from 'vscode-languageclient/node';
import {
  readCssVariablesConfig,
  buildServerArgs,
  createFileWatchers as createWatchers,
  determineServerOptions,
  LANGUAGE_IDS,
} from './helpers';
import {
  getPlatformIdentifier,
} from './platform';

let client: LanguageClient | undefined;
let restartChain = Promise.resolve();
let clientStart = Promise.resolve();
let fileWatchers: FileSystemWatcher[] = [];
let active = false;
let outputChannel: OutputChannel | undefined;
let configChangeTimer: NodeJS.Timeout | undefined;

function disposeFileWatchers() {
  for (const watcher of fileWatchers) {
    watcher.dispose();
  }
  fileWatchers = [];
}

function createClient(context: ExtensionContext): LanguageClient | null {
  const config = readCssVariablesConfig();
  const args = buildServerArgs(config);

  disposeFileWatchers();
  fileWatchers = createWatchers(config.lookupFiles);

  for (const w of fileWatchers) {
    context.subscriptions.push(w);
  }

  const serverOptions = determineServerOptions(context, config, args, outputChannel);
  if (!serverOptions) {
    return null;
  }

  const clientOptions = {
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

  context.subscriptions.push(lc);
  return lc;
}

function startClient(newClient: LanguageClient): void {
  clientStart = newClient.start().catch((error: unknown) => {
    outputChannel?.appendLine(
      '[css-variables] Failed to start language client: ' + String(error),
    );
    console.error('[css-variables] Failed to start language client', error);
  });
}

async function stopClient(): Promise<void> {
  await clientStart;
  const stoppingClient = client;
  if (stoppingClient && stoppingClient.state !== State.Stopped) {
    await stoppingClient.stop();
  }
  client = undefined;
}

function restartClient(context: ExtensionContext): Promise<void> {
  restartChain = restartChain.then(async () => {
    if (!active) {
      return;
    }
    await stopClient();
    // Deactivation can happen while startup or shutdown is still in flight.
    if (!active) {
      return;
    }
    const newClient = createClient(context);
    if (newClient) {
      client = newClient;
      startClient(newClient);
      await clientStart;
    }
  }).catch((error: unknown) => {
    outputChannel?.appendLine(
      '[css-variables] Failed to restart language client: ' + String(error),
    );
    console.error('[css-variables] Failed to restart language client', error);
  });
  return restartChain;
}

export function activate(context: ExtensionContext) {
  active = true;

  outputChannel = window.createOutputChannel('CSS Variables');
  context.subscriptions.push(outputChannel);

  outputChannel?.appendLine(`[css-variables] Activating extension...`);
  outputChannel?.appendLine(
    `[css-variables] Platform: ${getPlatformIdentifier()}`,
  );

  const newClient = createClient(context);
  if (newClient) {
    client = newClient;
    startClient(newClient);
  } else {
    outputChannel?.appendLine(
      '[css-variables] Failed to create language client',
    );
  }

  context.subscriptions.push(
    workspace.onDidChangeConfiguration((event) => {
      if (active && event.affectsConfiguration('cssVariables')) {
        if (configChangeTimer) clearTimeout(configChangeTimer);
        configChangeTimer = setTimeout(() => void restartClient(context), 250);
      }
    }),
  );
}

export function deactivate(): Promise<void> {
  active = false;
  if (configChangeTimer) {
    clearTimeout(configChangeTimer);
    configChangeTimer = undefined;
  }

  return restartChain.then(stopClient).catch((error: unknown) => {
    outputChannel?.appendLine(
      '[css-variables] Ignoring error while stopping language client: ' + String(error),
    );
  }).finally(disposeFileWatchers);
}
