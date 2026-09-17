// @vitest-environment node

import { execFile } from 'node:child_process'
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'
import { unzipSync } from 'fflate'

const executeFile = promisify(execFile)
const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  )
})

describe('plugin packaging', () => {
  it('creates the required marketplace archive and an identical branded copy', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'outline-view-pack-'))
    temporaryDirectories.push(root)
    const dist = path.join(root, 'dist')
    await mkdir(dist)
    await Promise.all([
      writeFile(path.join(dist, 'main.js'), 'export default {}'),
      writeFile(path.join(dist, 'manifest.json'), '{"version":"0.1.0"}'),
      writeFile(path.join(dist, 'style.css'), '.outline-view {}'),
      writeFile(path.join(dist, 'LICENSE.md'), 'MIT License - test fixture'),
      writeFile(path.join(dist, 'THIRD-PARTY-NOTICES.md'), 'Third-party test fixture'),
      writeFile(path.join(dist, 'private-notes.md'), 'must not ship'),
    ])

    const packScript = fileURLToPath(new URL('../pack.js', import.meta.url))
    await executeFile(process.execPath, [packScript], { cwd: root })

    const canonical = await readFile(path.join(root, 'plugin.zip'))
    const branded = await readFile(
      path.join(root, 'plugin_typora-outline-view.zip'),
    )
    expect(branded).toEqual(canonical)
    const entries = unzipSync(canonical)
    expect(Object.keys(entries).sort()).toEqual(['LICENSE.md', 'THIRD-PARTY-NOTICES.md', 'main.js', 'manifest.json', 'style.css'])
    expect(Buffer.from(entries['LICENSE.md']).toString()).toBe('MIT License - test fixture')
  }, 30000)
})
