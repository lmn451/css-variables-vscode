const esbuild = require("esbuild");
const fs = require("fs/promises");
const path = require("path");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',
	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				if (location) {
					console.error(`    ${location.file}:${location.line}:${location.column}:`);
				}
			});
			console.log('[watch] build finished');
		});
	},
};

const allowNamedColorsPlugin = {
	name: 'allow-named-colors',
	setup(build) {
		build.onEnd(async (result) => {
			if (result.errors.length > 0) {
				return;
			}
			const outdir = build.initialOptions.outdir || 'dist';
			const serverPath = path.join(outdir, 'server.js');
			let contents;
			try {
				contents = await fs.readFile(serverPath, 'utf8');
			} catch (error) {
				console.warn(`[allow-named-colors] Unable to read ${serverPath}: ${error}`);
				return;
			}
			const needle = 'function parseColor(value, options = {}) {';
			const injected = `${needle}\n      options = { allowNamedColors: true, ...options };`;
			if (!contents.includes(needle)) {
				console.warn('[allow-named-colors] Unable to patch parseColor');
				return;
			}
			if (contents.includes('allowNamedColors: true')) {
				return;
			}
			contents = contents.replace(needle, injected);
			await fs.writeFile(serverPath, contents, 'utf8');
		});
	},
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: {
			extension: 'src/extension.ts',
			server: 'node_modules/css-variable-lsp/out/server.js'
		},
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outdir: 'dist',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [
			allowNamedColorsPlugin,
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
		],
	});

	if (watch) {
		await ctx.watch();
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
