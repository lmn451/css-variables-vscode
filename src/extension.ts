import * as path from 'path';
import { workspace, ExtensionContext, FileSystemWatcher } from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

const DEFAULT_LOOKUP_FILES = [
	'**/*.less',
	'**/*.scss',
	'**/*.sass',
	'**/*.css',
	'**/*.html',
	'**/*.vue',
	'**/*.svelte',
	'**/*.astro',
	'**/*.ripple'
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
	'**/tmp/**'
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
	'ripple'
];

type PathDisplayMode = 'relative' | 'absolute' | 'abbreviated';
type UndefinedVarFallbackMode = 'warning' | 'info' | 'off';

type CssVariablesConfig = {
	lookupFiles: string[];
	blacklistFolders: string[];
	colorOnlyVariables: boolean;
	noColorPreview: boolean;
	pathDisplay?: PathDisplayMode;
	pathDisplayLength?: number;
	undefinedVarFallback?: UndefinedVarFallbackMode;
};

let client: LanguageClient | undefined;
let restartChain = Promise.resolve();
let fileWatchers: FileSystemWatcher[] = [];

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
	if (Array.isArray(value)) {
		return value
			.filter((entry): entry is string => typeof entry === 'string')
			.map(entry => entry.trim())
			.filter(entry => entry.length > 0);
	}
	return fallback;
}

function normalizePathDisplay(value: unknown): PathDisplayMode | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}
	const normalized = value.toLowerCase();
	if (normalized === 'relative' || normalized === 'absolute' || normalized === 'abbreviated') {
		return normalized;
	}
	return undefined;
}

function normalizePathDisplayLength(value: unknown): number | undefined {
	if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
		return undefined;
	}
	return Math.floor(value);
}

function normalizeUndefinedVarFallback(
	value: unknown
): UndefinedVarFallbackMode | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}
	const normalized = value.trim().toLowerCase();
	switch (normalized) {
		case 'warning':
		case 'warn':
			return 'warning';
		case 'info':
		case 'information':
			return 'info';
		case 'off':
		case 'disable':
		case 'disabled':
		case 'none':
		case 'omit':
			return 'off';
		default:
			return undefined;
	}
}

function readCssVariablesConfig(): CssVariablesConfig {
	const config = workspace.getConfiguration('cssVariables');
	const lookupFiles = normalizeStringArray(
		config.get('lookupFiles'),
		DEFAULT_LOOKUP_FILES
	);
	const blacklistFolders = normalizeStringArray(
		config.get('blacklistFolders'),
		DEFAULT_BLACKLIST_FOLDERS
	);
	const colorOnlyVariables = config.get<boolean>('colorOnlyVariables', true);
	const noColorPreview = config.get<boolean>('noColorPreview', false);
	const pathDisplay = normalizePathDisplay(config.get('pathDisplay'));
	const pathDisplayLength = normalizePathDisplayLength(config.get('pathDisplayLength'));
	const undefinedVarFallback = normalizeUndefinedVarFallback(
		config.get('undefinedVarFallback')
	);

	return {
		lookupFiles,
		blacklistFolders,
		colorOnlyVariables,
		noColorPreview,
		pathDisplay,
		pathDisplayLength,
		undefinedVarFallback
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

function createFileWatchers(lookupFiles: string[]): FileSystemWatcher[] {
	const patterns = lookupFiles.length > 0 ? lookupFiles : DEFAULT_LOOKUP_FILES;
	const uniquePatterns = Array.from(
		new Set(patterns.map(pattern => pattern.trim()).filter(Boolean))
	);

	return uniquePatterns.map(pattern => workspace.createFileSystemWatcher(pattern));
}

function disposeFileWatchers() {
	for (const watcher of fileWatchers) {
		watcher.dispose();
	}
	fileWatchers = [];
}

function createClient(context: ExtensionContext): LanguageClient {
	const serverModule = context.asAbsolutePath(
		path.join('dist', 'server.js')
	);

	const config = readCssVariablesConfig();
	const args = buildServerArgs(config);
	disposeFileWatchers();
	fileWatchers = createFileWatchers(config.lookupFiles);

	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc, args },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			args,
			options: { execArgv: ['--nolazy', '--inspect=6009'] }
		}
	};

	const clientOptions: LanguageClientOptions = {
		documentSelector: LANGUAGE_IDS.map(language => ({ scheme: 'file', language })),
		synchronize: {
			fileEvents: fileWatchers
		}
	};

	return new LanguageClient(
		'cssVariableLsp',
		'CSS Variables Language Server',
		serverOptions,
		clientOptions
	);
}

async function restartClient(context: ExtensionContext) {
	restartChain = restartChain.then(async () => {
		if (client) {
			await client.stop();
		}
		client = createClient(context);
		await client.start();
	}).catch(error => {
		console.error('[css-variables] Failed to restart language client', error);
	});
	return restartChain;
}

export function activate(context: ExtensionContext) {
	client = createClient(context);
	void client.start();

	context.subscriptions.push(
		workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration('cssVariables')) {
				void restartClient(context);
			}
		})
	);
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	disposeFileWatchers();
	return client.stop();
}
