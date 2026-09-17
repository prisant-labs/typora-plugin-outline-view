import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { compile } from 'sass'

const root = fileURLToPath(new URL('../', import.meta.url))
const normalize = value => value.replace(/\r\n?/g, '\n')
const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

async function sources(directory, sourceRoot) {
  const entries = await readdir(path.join(sourceRoot, directory), { withFileTypes: true })
  const files = await Promise.all(entries.map(entry => {
    const name = directory + '/' + entry.name
    return entry.isDirectory() ? sources(name, sourceRoot) : /\.(ts|scss|html|json)$/.test(name) && !name.endsWith('.test.ts') ? [name] : []
  }))
  return files.flat().sort()
}

export async function renderPrototype(sourceRoot = root) {
  const read = async name => normalize(await readFile(path.join(sourceRoot, name), 'utf8'))
  const manifest = JSON.parse(await read('src/manifest.json'))
  const corePath = 'node_modules/@typora-community-plugin/core/'
  const core = JSON.parse(await read(corePath + 'package.json'))
  const license = await read(corePath + 'LICENSE.md')
  const ownLicense = await read('LICENSE.md')
  const files = [...await sources('src', sourceRoot), ...await sources('prototype', sourceRoot), 'LICENSE.md', 'test/support/typora-core.ts', 'scripts/prototype.mjs', 'package.json', 'pnpm-lock.yaml', corePath + 'dist/core.css', corePath + 'LICENSE.md'].sort()
  const hash = createHash('sha256')
  for (const file of files) hash.update(file + '\0' + await read(file) + '\0')
  const fingerprint = hash.digest('hex')
  const bundled = await build({
    absWorkingDir: sourceRoot, entryPoints: ['prototype/main.ts'], bundle: true,
    write: false, format: 'iife', platform: 'browser', target: 'es2022',
    minify: true, charset: 'ascii', legalComments: 'none',
    alias: { '@typora-community-plugin/core': './prototype/host.ts' },
  })
  // Core includes other host surfaces and may reference fonts/images. This
  // prototype needs no such assets. Remove all URL loads, including source maps.
  const hostCss = (await read(corePath + 'dist/core.css'))
    .replace(/\/\*# sourceMappingURL=[\s\S]*?\*\//g, '')
    .replace(/@import\s+[^;]+;/g, '')
    .replace(/url\([^)]*\)/g, 'none')
  const css = [hostCss, compile(path.join(sourceRoot, 'prototype/shell.scss'), { style: 'compressed' }).css, compile(path.join(sourceRoot, 'src/style.scss'), { style: 'compressed' }).css].join('\n')
  const values = {
    VERSION: escapeHtml(manifest.version), CORE_VERSION: escapeHtml(core.version),
    FINGERPRINT: fingerprint, LICENSE: escapeHtml('Outline View:\n' + ownLicense + '\nTypora Community Plugin core CSS and adapter contract:\n' + license),
    CSS: normalize(css).replace(/<\/style/gi, '<\\/style'),
    JS: normalize(bundled.outputFiles[0].text).replace(/<\/script/gi, '<\\/script'),
  }
  return (await read('prototype/shell.html')).replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error('Unknown prototype placeholder: ' + key)
    return values[key]
  })
}

async function main() {
  const args = process.argv.slice(2)
  let check = false
  let output = path.join(root, 'docs/prototype/settings.html')
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--check') check = true
    else if (args[i] === '--output' && args[i + 1]) output = path.resolve(args[++i])
    else throw new Error('Usage: node scripts/prototype.mjs [--check] [--output path]')
  }
  const html = await renderPrototype()
  if (check) {
    const existing = await readFile(output, 'utf8').catch(error => {
      if (error.code === 'ENOENT') return ''
      throw error
    })
    if (normalize(existing) !== html) throw new Error('Settings prototype is missing or stale. Run pnpm prototype:build and include docs/prototype/settings.html with your changes.')
    console.log('Settings prototype is current.')
  } else {
    await mkdir(path.dirname(output), { recursive: true })
    await writeFile(output, html, 'utf8')
    console.log('Generated standalone settings prototype: ' + output)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
