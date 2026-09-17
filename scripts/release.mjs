import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { unzipSync } from 'fflate'

export const releaseFiles = ['LICENSE.md', 'THIRD-PARTY-NOTICES.md', 'main.js', 'manifest.json', 'style.css']

export function validateMetadata(source, pkg, built, tag) {
  assert.equal(source.id, 'prisant-labs.outline-view', 'Plugin identity changed')
  assert.equal(source.repo, 'prisant-labs/typora-plugin-outline-view', 'Repository identity changed')
  assert.match(source.version, /^\d+\.\d+\.\d+$/, 'Expected a release version')
  assert.equal(source.version, pkg.version, 'Package and manifest version differ')
  assert.equal(pkg.license, 'MIT', 'Expected MIT license')
  assert.equal(source.minCoreVersion, pkg.devDependencies['@typora-community-plugin/core'], 'Core must be pinned to the tested minimum')
  assert.deepEqual(built, source, 'Built manifest differs from source manifest')
  if (tag !== undefined) assert.equal(tag, source.version, 'Release tag must exactly match version (no v prefix)')
}

export function validatePayload(actual, expected) {
  assert.deepEqual(Object.keys(actual).sort(), releaseFiles, 'Unexpected or missing ZIP entries')
  for (const name of releaseFiles) {
    assert.ok(actual[name].length > 0, 'Empty release file: ' + name)
    assert.deepEqual(Buffer.from(actual[name]), Buffer.from(expected[name]), 'ZIP differs from build: ' + name)
  }
}

// Only validate locally built archives. This is not an untrusted ZIP extraction API.
export async function validateRelease(root = process.cwd(), tag) {
  const read = name => readFile(path.join(root, name))
  const json = async name => JSON.parse((await read(name)).toString('utf8'))
  const source = await json('src/manifest.json')
  validateMetadata(source, await json('package.json'), await json('dist/manifest.json'), tag)
  const archive = await read('plugin.zip')
  assert.deepEqual(await read('plugin_typora-outline-view.zip'), archive, 'Branded ZIP differs from plugin.zip')
  const expected = Object.fromEntries(await Promise.all(releaseFiles.map(async name => [name, await read('dist/' + name)])))
  validatePayload(unzipSync(archive), expected)
  for (const name of ['LICENSE.md', 'THIRD-PARTY-NOTICES.md']) {
    assert.deepEqual(expected[name], await read(name), 'Stale license notice: ' + name)
  }
  return { version: source.version, files: releaseFiles, sha256: createHash('sha256').update(archive).digest('hex') }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.length && (args.length !== 2 || args[0] !== '--tag')) {
    console.error('Usage: node scripts/release.mjs [--tag 0.2.1]')
    process.exitCode = 1
  } else {
    validateRelease(process.cwd(), args[1]).then(result => console.log(JSON.stringify(result, null, 2)))
      .catch(error => { console.error(error.message); process.exitCode = 1 })
  }
}
