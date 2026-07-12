import { build, createServer } from 'vite';
import { rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import liveReload from '@magic-spells/vite-plugin-live-reload';

const isDev = process.env.NODE_ENV === 'development';
const outDir = isDev ? 'demo/dist' : 'dist';

function sharedBuild(overrides = {}) {
	return {
		configFile: false,
		logLevel: isDev ? 'warn' : 'info',
		build: {
			outDir,
			emptyOutDir: false,
			sourcemap: true,
			target: 'es2022',
			reportCompressedSize: !isDev,
			watch: isDev ? {} : null,
			...overrides.build,
		},
		...Object.fromEntries(Object.entries(overrides).filter(([k]) => k !== 'build')),
	};
}

// npm consumers' bundlers resolve the engine deps — only the ESM build externalizes them
function esmConfig() {
	return sharedBuild({
		build: {
			lib: {
				entry: 'src/index.js',
				fileName: () => 'morph-engine.esm.js',
				formats: ['es'],
			},
			minify: false,
			rolldownOptions: {
				external: ['@magic-spells/physics-engine', '@magic-spells/frame-engine'],
				output: { exports: 'named' },
			},
		},
	});
}

// UMD builds bundle both deps — self-contained for unpkg and the demo
function umdMinConfig() {
	return sharedBuild({
		build: {
			lib: {
				entry: 'src/index.js',
				name: 'MorphEngine',
				fileName: () => 'morph-engine.min.js',
				formats: ['umd'],
			},
			minify: 'terser',
			terserOptions: {
				mangle: { keep_classnames: true, keep_fnames: false },
			},
			rolldownOptions: {
				output: { exports: 'named' },
			},
		},
	});
}

// Unminified UMD — dev only. The demo references `/dist/morph-engine.js` for
// readable stack traces without polluting the prod `dist/`.
function umdDevConfig() {
	return sharedBuild({
		build: {
			lib: {
				entry: 'src/index.js',
				name: 'MorphEngine',
				fileName: () => 'morph-engine.js',
				formats: ['umd'],
			},
			minify: false,
			rolldownOptions: {
				output: { exports: 'named' },
			},
		},
	});
}

async function main() {
	if (!isDev) {
		// Clean prod output before building
		await rm(outDir, { recursive: true, force: true });
		await mkdir(outDir, { recursive: true });
	} else if (!existsSync(outDir)) {
		await mkdir(outDir, { recursive: true });
	}

	const configs = [esmConfig(), umdMinConfig()];
	if (isDev) configs.push(umdDevConfig());

	if (isDev) {
		// Fire all builds in parallel (watch mode — they don't block)
		for (const cfg of configs) {
			build(cfg).catch((e) => {
				console.error('build error:', e);
			});
		}

		// Start dev server serving demo/
		const server = await createServer({
			configFile: false,
			root: 'demo',
			server: { port: 3011, open: true, strictPort: false },
			plugins: [liveReload('demo/dist')],
		});
		await server.listen();
		server.printUrls();
	} else {
		// Sequential builds for prod (deterministic + smaller memory footprint)
		for (const cfg of configs) {
			await build(cfg);
		}
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
