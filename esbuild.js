const esbuild = require('esbuild');
const isWatch = process.argv.includes('--watch');

const config = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: true,
};

if (isWatch) {
  esbuild.context(config).then(ctx => ctx.watch());
} else {
  esbuild.build(config);
}
