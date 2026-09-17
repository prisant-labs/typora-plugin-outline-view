import { Plugin, PluginSettings } from './host'
import { normalizeOutlineSettings, type OutlineSettings } from '../src/settings/model'
import { OutlineSettingsTab } from '../src/settings/settings-tab'
import manifest from '../src/manifest.json'

const app = {
  workspace: { on: () => () => {} },
  features: { markdownEditor: { on: () => () => {} } },
}
const plugin = new Plugin<OutlineSettings>(app, manifest)
const settings = new PluginSettings<OutlineSettings>(app, manifest, { version: 1 })
settings.setDefault(normalizeOutlineSettings())
plugin.registerSettings(settings)
const tab = new OutlineSettingsTab(plugin as never, app as never)
const mount = document.querySelector<HTMLElement>('#settings-mount')!
const editor = document.querySelector<HTMLElement>('#write')!
mount.append(tab.containerEl)

function fixture(value: string) {
  editor.replaceChildren()
  const headings: Array<[number, string]> = value === 'empty' ? [] : value === 'long' ? [
    [1, 'A deliberately long heading to evaluate wrapping, truncation, and font scaling'],
    [3, 'Skipped levels remain attached to the nearest parent'],
    [6, 'Deeply nested details with enough text to wrap across several lines'],
    [2, 'Another branch with international text: Café, 日本語, Ελληνικά'],
  ] : [
    [1, 'Project overview'], [2, 'Design and structure'], [3, 'Navigation details'],
    [4, 'Interaction behavior'], [5, 'Accessibility details'], [6, 'Implementation notes'],
    [2, 'Testing and release'], [3, 'Theme compatibility'], [1, 'Next steps'],
  ]
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
document.querySelector<HTMLButtonElement>('#prototype-reset')!.addEventListener('click', () => {
  const defaults = normalizeOutlineSettings()
  for (const key of Object.keys(defaults) as Array<keyof OutlineSettings>) settings.set(key, defaults[key])
  tab.onshow()
  mount.scrollTop = 0
})
window.addEventListener('pagehide', () => tab.onhide())
window.addEventListener('pageshow', event => { if (event.persisted) tab.onshow() })
fixture('hierarchy')
document.documentElement.dataset.prototypeReady = 'true'
