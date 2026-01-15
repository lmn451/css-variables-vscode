import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	const config = workspace.getConfiguration('cssVariableLsp');

	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('dist', 'server.js')
	);

	const lookupFiles = config.get<string[]>('lookupFiles', [
		'**/*.less',
		'**/*.scss',
		'**/*.sass',
		'**/*.css',
		'**/*.html',
		'**/*.vue',
		'**/*.svelte',
		'**/*.astro',
		'**/*.ripple'
	]);

	const blacklistFolders = config.get<string[]>('blacklistFolders', [
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
	]);

	const serverArgs = [
		'--color-only-variables',
		'--stdio'
	];

	for (const glob of lookupFiles) {
		serverArgs.push('--lookup-file', glob);
	}

	for (const glob of blacklistFolders) {
		serverArgs.push('--ignore-glob', glob);
	}

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: {
			module: serverModule,
			transport: TransportKind.ipc,
			args: serverArgs
		},
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: { execArgv: ['--nolazy', '--inspect=6009'] },
			args: serverArgs
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		documentSelector: [
			{ scheme: 'file', language: 'css' },
			{ scheme: 'file', language: 'scss' },
			{ scheme: 'file', language: 'sass' },
			{ scheme: 'file', language: 'less' },
			{ scheme: 'file', language: 'html' },
			{ scheme: 'file', language: 'javascript' },
			{ scheme: 'file', language: 'typescript' },
			{ scheme: 'file', language: 'javascriptreact' },
			{ scheme: 'file', language: 'typescriptreact' },
			{ scheme: 'file', language: 'svelte' },
			{ scheme: 'file', language: 'vue' },
			{ scheme: 'file', language: 'astro' },
			{ scheme: 'file', language: 'postcss' }
		],
		synchronize: {
			fileEvents: workspace.createFileSystemWatcher('**/*.{css,scss,sass,less,html,js,ts,jsx,tsx,vue,svelte,astro}')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'cssVariableLsp',
		'CSS Variable Language Server',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
