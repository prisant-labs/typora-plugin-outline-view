// @vitest-environment node
import { execFile } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'

const exec = promisify(execFile)
const root = fileURLToPath(new URL('../', import.meta.url))
const script = path.join(root, 'scripts/prototype.mjs')
const temporary: string[] = []
afterEach(async () => { await Promise.all(temporary.splice(0).map(dir => rm(dir, { recursive: true, force: true }))) })

describe('maintained standalone settings prototype', () => {
  it('generates deterministic offline HTML and rejects stale or missing artifacts without rewriting', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'outline-prototype-'))
    temporary.push(dir)
    const output = path.join(dir, 'settings.html')
    await exec(process.execPath, [script, '--output', output], { cwd: root })
    const first = await readFile(output, 'utf8')
    expect(first).toContain('Live outline preview')
    expect(first).toContain('Outline View settings sections')
    expect(first).toContain('Content-Security-Policy')
    expect(first).toContain('data-source-fingerprint=')
    expect(first.includes('Copyright (c) 2026 Prisant Labs')).toBe(true)
    expect(first.includes('Copyright (c) 2023 plylrnsdy')).toBe(true)
    expect(first).not.toMatch(/<(?:script|link)\b[^>]*(?:src|href)=/i)
    expect(first).not.toMatch(/url\(\s*["']?(?:https?:|\/)/i)
    expect(first).not.toContain(root.replaceAll('\\', '/'))
    await exec(process.execPath, [script, '--output', output], { cwd: root })
    expect(await readFile(output, 'utf8')).toBe(first)
    await exec(process.execPath, [script, '--check', '--output', output], { cwd: root })
    await writeFile(output, first.replace('Live outline preview', 'Stale preview'))
    await expect(exec(process.execPath, [script, '--check', '--output', output], { cwd: root })).rejects.toMatchObject({ code: 1 })
    expect(await readFile(output, 'utf8')).toContain('Stale preview')
    await expect(exec(process.execPath, [script, '--check', '--output', path.join(dir, 'missing.html')], { cwd: root })).rejects.toMatchObject({ code: 1 })
  }, 30000)

  it('runs the freshness check in CI without regenerating first', async () => {
    const workflow = await readFile(path.join(root, '.github/workflows/ci.yml'), 'utf8')
    expect(workflow).toContain('run: pnpm prototype:check')
    expect(workflow).not.toContain('run: pnpm prototype:build')
    const attributes = await readFile(path.join(root, '.gitattributes'), 'utf8')
    expect(attributes).toContain('docs/prototype/settings.html text eol=lf')
  })

  it('changes the reference when production source changes even outside the settings bundle', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'outline-prototype-source-'))
    temporary.push(dir)
    for (const file of ['src', 'prototype', 'LICENSE.md', 'test/support/typora-core.ts', 'scripts/prototype.mjs', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'node_modules/@typora-community-plugin/core/dist/core.css', 'node_modules/@typora-community-plugin/core/package.json', 'node_modules/@typora-community-plugin/core/LICENSE.md']) {
      await mkdir(path.dirname(path.join(dir, file)), { recursive: true })
      await cp(path.join(root, file), path.join(dir, file), { recursive: true })
    }
    const { renderPrototype } = await import('./prototype.mjs')
    const before = await renderPrototype(dir)
    expect(before).toBe(await renderPrototype(root))
    const source = path.join(dir, 'src/main.ts')
    await writeFile(source, (await readFile(source, 'utf8')) + '\n// Source-only change must invalidate the reference.\n')
    const after = await renderPrototype(dir)
    expect(after).not.toBe(before)
    expect(after.match(/data-source-fingerprint="([^"]+)"/)?.[1]).not.toBe(before.match(/data-source-fingerprint="([^"]+)"/)?.[1])
  }, 30000)
})
