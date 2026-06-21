import * as esbuild from 'esbuild'
import { glob } from 'glob'

const entryPoints = await glob('src/**/*.ts')

await esbuild.build({
  entryPoints,
  bundle: false,
  outdir: 'dist',
  platform: 'node',
  format: 'esm',
  target: 'es2022',
  sourcemap: true,
  outExtension: { '.js': '.js' },
  packages: 'external',
})

console.log('✅ Build complete')
