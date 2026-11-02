import type { ExtensionContext } from 'vscode';

type Deferred = { promise: Promise<void>; resolve: () => void };
function deferred(): Deferred {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

const mockClients: Array<{ start: jest.Mock; stop: jest.Mock; state: number }> = [];
const mockStarts: Array<Promise<void>> = [];
const mockStops: Array<Promise<void>> = [];
const mockLog = jest.fn();
let mockConfigurationChanged: (event: { affectsConfiguration: () => boolean }) => void;

jest.mock('vscode', () => ({
  workspace: {
    onDidChangeConfiguration: jest.fn((callback) => {
      mockConfigurationChanged = callback;
      return { dispose: jest.fn() };
    }),
  },
  window: { createOutputChannel: () => ({ appendLine: mockLog, dispose: jest.fn() }) },
}), { virtual: true });
jest.mock('vscode-languageclient/node', () => ({
  State: { Stopped: 1, Starting: 3 },
  LanguageClient: jest.fn().mockImplementation(() => {
    const client = {
      state: 3,
      start: jest.fn(() => mockStarts.shift() ?? Promise.resolve()),
      stop: jest.fn(() => mockStops.shift() ?? Promise.resolve()),
    };
    mockClients.push(client);
    return client;
  }),
}));
jest.mock('../src/helpers', () => ({
  readCssVariablesConfig: () => ({ lookupFiles: ['**/*.css'] }),
  buildServerArgs: () => [],
  createFileWatchers: () => [{ dispose: jest.fn() }],
  determineServerOptions: () => ({ command: 'test-server' }),
  LANGUAGE_IDS: ['css'],
}));
jest.mock('../src/platform', () => ({ getPlatformIdentifier: () => 'test' }));

let extension: typeof import('../src/extension');
const context = () => ({ subscriptions: [] }) as unknown as ExtensionContext;
async function requestRestart() {
  mockConfigurationChanged({ affectsConfiguration: () => true });
  await jest.advanceTimersByTimeAsync(250);
}

beforeEach(() => {
  jest.resetModules();
  jest.useFakeTimers();
  mockClients.length = 0;
  mockStarts.length = 0;
  mockStops.length = 0;
  mockLog.mockClear();
  extension = require('../src/extension') as typeof extension;
});
afterEach(async () => {
  await extension.deactivate();
  jest.useRealTimers();
});

test('deactivation waits for initial startup before stopping the client', async () => {
  const starting = deferred();
  mockStarts.push(starting.promise);
  extension.activate(context());
  const stopping = extension.deactivate();
  expect(mockClients[0].stop).not.toHaveBeenCalled();
  starting.resolve();
  await stopping;
  expect(mockClients[0].stop).toHaveBeenCalledTimes(1);
});

test('deactivation during restart never starts a replacement or queued restart', async () => {
  const stopping = deferred();
  mockStops.push(stopping.promise);
  extension.activate(context());
  await requestRestart();
  await requestRestart();
  const shutdown = extension.deactivate();
  stopping.resolve();
  await shutdown;
  expect(mockClients).toHaveLength(1);
  expect(mockClients[0].stop).toHaveBeenCalledTimes(1);
});

test('restart waits for startup before stopping a client', async () => {
  const starting = deferred();
  mockStarts.push(starting.promise);
  extension.activate(context());
  await requestRestart();
  expect(mockClients[0].stop).not.toHaveBeenCalled();
  starting.resolve();
  await jest.advanceTimersByTimeAsync(0);
  expect(mockClients).toHaveLength(2);
  expect(mockClients[0].stop).toHaveBeenCalledTimes(1);
});

test('deactivation cancels the pending configuration debounce', async () => {
  extension.activate(context());
  mockConfigurationChanged({ affectsConfiguration: () => true });
  await extension.deactivate();
  expect(jest.getTimerCount()).toBe(0);
  await jest.advanceTimersByTimeAsync(250);
  expect(mockClients).toHaveLength(1);
});

test('a failed replacement startup is logged and a later restart can recover', async () => {
  extension.activate(context());
  const starting = deferred();
  mockStarts.push(starting.promise.then(() => { throw new Error('startup failed'); }));
  await requestRestart();
  starting.resolve();
  await jest.advanceTimersByTimeAsync(0);
  await requestRestart();
  expect(mockLog.mock.calls.some(([message]) => String(message).includes('startup failed'))).toBe(true);
  expect(mockClients).toHaveLength(3);
});
