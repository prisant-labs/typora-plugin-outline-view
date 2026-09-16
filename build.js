import * as fs from 'node:fs/promises'
import * as esbuild from 'esbuild'
import typoraPlugin, { installDevPlugin } from 'esbuild-plugin-typora'
import { sassPlugin } from 'esbuild-sass-plugin'

import {
  assertTyporaClosed,
  launchTypora,
} from './scripts/launch-typora.js'

const isProduction = process.argv.slice(2).includes('--prod')

if (!isProduction) await assertTyporaClosed()

await fs.rm('./dist', { recursive: true, force: true })

await esbuild.build({
  entryPoints: ['src/main.ts'],
  outdir: 'dist',
  format: 'esm',
  bundle: true,
  minify: isProduction,
  sourcemap: !isProduction,
  plugins: [
    typoraPlugin({ mode: isProduction ? 'production' : 'development' }),
    sassPlugin(),
  ],
})

if (!isProduction) {
  await installDevPlugin()
  await launchTypora('./test/vault/doc.md')
}
