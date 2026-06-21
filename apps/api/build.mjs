import * as esbuild from 'esbuild';
import { glob } from 'glob';
import { execSync } from 'child_process';

console.log('📦 Building workspace dependencies first...');
execSync('pnpm --filter @casa-corona/db build', { stdio: 'inherit' });
execSync('pnpm --filter @casa-corona/api-zod build', { stdio: 'inherit' });

console.log('📦 Building @casa-corona/api...');
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

console.log('✅ @casa-corona/api build complete');
