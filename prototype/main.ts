import { Plugin, PluginSettings } from './host'
import { normalizeOutlineSettings, type OutlineSettings } from '../src/settings/model'
import { OutlineSettingsTab } from '../src/settings/settings-tab'
import manifest from '../src/manifest.json'
import { SAMPLE_HEADINGS } from '../src/settings/sample-headings'
import { buildUpdateConfirmation } from '../src/update/update-confirmation'

// Fixture-only: the next patch release, which Core's Marketplace would offer and GitHub would report.
const NEXT_VERSION = manifest.version.replace(/\d+$/, patch => String(Number(patch) + 1))
let update: string | undefined
let checkForUpdates = true
const listeners = new Set<() => void>()
const status = document.querySelector<HTMLElement>('#prototype-status')!
// Like the notifier, turning checks off stops requests but still shows what Core's Marketplace already holds (D025, OV-D3).
const updates = {
  state: () => ({ version: update, enabled: checkForUpdates }),
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
  load: async () => updates.state(),
  open: openUpdate,
  async setEnabled(enabled: boolean) { checkForUpdates = enabled; listeners.forEach(listener => listener()) },
  check() {},
}
function openUpdate() {
  const dialog = document.querySelector<HTMLDialogElement>('#update-dialog')!, version = updates.state().version
  if (!version) return
  document.querySelector('#update-mount')!.replaceChildren(buildUpdateConfirmation({
    name: manifest.name, installed: manifest.version, version, repo: manifest.repo,
    isOpen: () => dialog.open, close: () => dialog.close(),
    confirm() {
      dialog.close()
      status.textContent = `Simulated update: in Typora, Community Plugin Core now unloads ${manifest.name}, installs ${version}, and reloads it. Your ${manifest.name} settings are kept.`
      return new Promise(() => {})
    },
  }))
  dialog.showModal()
}

const app = {
  workspace: { on: () => () => {} },
  features: { markdownEditor: { on: () => () => {} } },
  openFileWithDefaultApp: async () => { window.alert('This offline prototype has no installed plugin folder to open.') },
  github: {
    getReleaseInfo: async () => update
      ? { tag_name: update, published_at: '2026-10-02T16:00:00Z' }
      : { tag_name: manifest.version, published_at: '2026-09-30T16:00:00Z' },
  },
}
const prototypeManifest = { ...manifest, dir: '(prototype only)' }
const plugin = new Plugin<OutlineSettings>(app, prototypeManifest)
const settings = new PluginSettings<OutlineSettings>(app, prototypeManifest, { version: 1 })
settings.setDefault(normalizeOutlineSettings())
plugin.registerSettings(settings)
const tab = new OutlineSettingsTab(plugin as never, app as never, updates)
const mount = document.querySelector<HTMLElement>('#settings-mount')!
const editor = document.querySelector<HTMLElement>('#write')!
mount.append(tab.containerEl)

function fixture(value: string) {
  editor.replaceChildren()
  const headings: ReadonlyArray<readonly [number, string]> = value === 'empty' ? [] : value === 'long' ? [
    [1, 'A deliberately long heading to evaluate wrapping, truncation, and font scaling'],
    [3, 'Skipped levels remain attached to the nearest parent'],
    [6, 'Deeply nested details with enough text to wrap across several lines'],
    [2, 'Another branch with international text: Café, 日本語, Ελληνικά'],
  ] : SAMPLE_HEADINGS
  for (const [level, label] of headings) {
    const heading = document.createElement('h' + level)
    heading.textContent = label
    editor.append(heading)
  }
  tab.onshow()
}

document.querySelector<HTMLSelectElement>('#prototype-theme')!.addEventListener('change', event => {
  document.documentElement.dataset.theme = (event.target as HTMLSelectElement).value
})
document.querySelector<HTMLSelectElement>('#prototype-width')!.addEventListener('change', event => {
  document.querySelector<HTMLElement>('.prototype-window')!.dataset.width = (event.target as HTMLSelectElement).value
})
document.querySelector<HTMLSelectElement>('#prototype-document')!.addEventListener('change', event => {
  fixture((event.target as HTMLSelectElement).value)
})
document.querySelector<HTMLSelectElement>('#prototype-updates')!.addEventListener('change', event => {
  update = (event.target as HTMLSelectElement).value === 'update-available' ? NEXT_VERSION : undefined
  status.textContent = ''
  tab.onshow()
})
document.querySelector<HTMLButtonElement>('#prototype-reset')!.addEventListener('click', () => {
  const defaults = normalizeOutlineSettings()
  for (const key of Object.keys(defaults) as Array<keyof OutlineSettings>) settings.set(key, defaults[key])
  checkForUpdates = true
  status.textContent = ''
  tab.onshow()
  mount.scrollTop = 0
})
window.addEventListener('pagehide', () => tab.onhide())
window.addEventListener('pageshow', event => { if (event.persisted) tab.onshow() })
fixture('hierarchy')
document.documentElement.dataset.prototypeReady = 'true'
