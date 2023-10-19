import * as path from 'path';
import * as esbuild from 'esbuild';

const outfile = path.resolve(Deno.cwd(), 'mod.min.mjs');

const entryPoints = [path.resolve(Deno.cwd(), 'mod.ts')];

// Bundle the module for Node.js and browsers
await esbuild.build({
  entryPoints,
  outfile,
  format: 'esm',
  target: 'esnext',
  platform: 'browser',
  bundle: true,
  minify: true,
  allowOverwrite: true
});

esbuild.stop();

console.log(`Bundled module to: "${outfile}"`);
