// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { validateMetadata, validatePayload } from './release.mjs'

const manifest = { id: 'prisant-labs.outline-view', name: 'Outline View', author: 'Prisant Labs', repo: 'prisant-labs/typora-plugin-outline-view', version: '0.2.1', minAppVersion: '1.4.0', minCoreVersion: '2.10.21', platforms: ['win32', 'darwin'] }
const pkg = { version: '0.2.1', license: 'MIT', devDependencies: { '@typora-community-plugin/core': '2.10.21' } }
const files = Object.fromEntries(['main.js', 'manifest.json', 'style.css', 'LICENSE.md', 'THIRD-PARTY-NOTICES.md'].map(name => [name, Buffer.from(name)]))

describe('release metadata gate', () => {
  it('accepts consistent source, build and optional exact release tag', () => {
    expect(() => validateMetadata(manifest, pkg, { ...manifest }, '0.2.1')).not.toThrow()
  })
  it('rejects package version drift', () => {
    expect(() => validateMetadata(manifest, { ...pkg, version: '0.2.0' }, manifest)).toThrow(/version/i)
  })
  it('rejects any stale built manifest field', () => {
    expect(() => validateMetadata(manifest, pkg, { ...manifest, platforms: ['win32'] })).toThrow(/manifest/i)
  })
  it('rejects a tag that does not match the version', () => {
    expect(() => validateMetadata(manifest, pkg, manifest, 'v0.2.1')).toThrow(/tag/i)
  })
  it('rejects changed plugin identity and core baseline', () => {
    const wrong = { ...manifest, id: 'other.plugin' }
    expect(() => validateMetadata(wrong, pkg, wrong)).toThrow(/identity/i)
    expect(() => validateMetadata(manifest, { ...pkg, devDependencies: { '@typora-community-plugin/core': '^2.10.21' } }, manifest)).toThrow(/core/i)
  })
})

describe('release ZIP payload gate', () => {
  it('accepts exactly the required nonempty files matching build bytes', () => {
    expect(() => validatePayload(files, files)).not.toThrow()
  })
  it('rejects a missing license', () => {
    const { 'LICENSE.md': _, ...withoutLicense } = files
    expect(() => validatePayload(withoutLicense, files)).toThrow(/entries/i)
  })
  it('rejects an extra private or nested file', () => {
    expect(() => validatePayload({ ...files, '_local/notes.md': Buffer.from('private') }, files)).toThrow(/entries/i)
  })
  it('rejects an empty runtime and mismatched build bytes', () => {
    expect(() => validatePayload({ ...files, 'main.js': Buffer.alloc(0) }, files)).toThrow(/main.js/i)
    expect(() => validatePayload({ ...files, 'style.css': Buffer.from('stale') }, files)).toThrow(/style.css/i)
  })
})
