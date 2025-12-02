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
	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('dist', 'server.js')
	);

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: { execArgv: ['--nolazy', '--inspect=6009'] }
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for css, scss, sass, less, and html documents
		documentSelector: [
			{ scheme: 'file', language: 'css' },
			{ scheme: 'file', language: 'scss' },
			{ scheme: 'file', language: 'sass' },
			{ scheme: 'file', language: 'less' },
			{ scheme: 'file', language: 'html' },
			{ scheme: 'file', language: 'javascript' },
			{ scheme: 'file', language: 'typescript' },
			{ scheme: 'file', language: 'javascriptreact' },
			{ scheme: 'file', language: 'typescriptreact' }
		],
		synchronize: {
			// Notify the server about file changes to '.css', '.scss', '.sass', '.less', '.html', '.js', '.ts', '.jsx', '.tsx' files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/*.{css,scss,sass,less,html,js,ts,jsx,tsx}')
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
