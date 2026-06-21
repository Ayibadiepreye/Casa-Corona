import * as esbuild from 'esbuild';
import { glob } from 'glob';

const entryPoints = await glob('src/**/*.ts');

await esbuild.build({
  entryPoints,
  bundle: false,
  outdir: 'dist',
  platform: 'node',
  format: 'esm',
  target: 'es2022',
  sourcemap: true,
  packages: 'external',
  loader: { '.ts': 'ts' },
});

console.log('✅ @casa-corona/api-zod build complete');
