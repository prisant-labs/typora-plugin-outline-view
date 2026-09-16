import {
  Plugin,
  PluginSettings,
} from '@typora-community-plugin/core'
import { describe, expect, it } from 'vitest'

import {
  DEFAULT_OUTLINE_SETTINGS,
  type OutlineSettings,
} from './model'
import { OutlineSettingsTab } from './settings-tab'

function createTab() {
  const app = {}
  const plugin = new (class extends Plugin<OutlineSettings> {})(
    app as never,
    { id: 'prisant-labs.outline-view', name: 'Outline View' } as never,
  )
  const settings = new PluginSettings<OutlineSettings>(
    app as never,
    plugin.manifest,
    { version: 1 },
  )
  settings.setDefault(DEFAULT_OUTLINE_SETTINGS)
  plugin.registerSettings(settings)

  const tab = new OutlineSettingsTab(plugin)
  tab.onshow()
  return { plugin, settings, tab }
}

function settingRow(tab: OutlineSettingsTab, name: string) {
  return Array.from(tab.containerEl.querySelectorAll('.typ-setting-item')).find(
    (row) => row.querySelector('.typ-setting-name')?.textContent?.trim() === name,
  ) as HTMLElement | undefined
}

describe('OutlineSettingsTab', () => {
  it('uses the manifest name and renders every approved setting', () => {
    const { tab } = createTab()

    expect(tab.name).toBe('Outline View')
    expect(tab.containerEl.classList.contains('outline-view-settings')).toBe(true)
    expect(
      Array.from(tab.containerEl.querySelectorAll('.typ-setting-name')).map(
        (name) => name.textContent?.trim(),
      ),
    ).toEqual([
      'Open automatically',
      'Follow active heading',
      'Auto-scroll outline',
      'Remember collapse state during the session',
      'Minimum heading level',
      'Maximum heading level',
      'Expand by default through',
      'Wrap long heading labels',
      'Density',
      'Indentation',
    ])
  })

  it('shows the approved defaults', () => {
    const { tab } = createTab()
    const checkboxes = Array.from(
      tab.containerEl.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    )
    const selects = Array.from(
      tab.containerEl.querySelectorAll<HTMLSelectElement>('select'),
    )

    expect(checkboxes.map(({ checked }) => checked)).toEqual([
      false,
      true,
      true,
      true,
      true,
    ])
    expect(selects.map(({ value }) => value)).toEqual([
      '1',
      '6',
      '3',
      'comfortable',
      'medium',
    ])
  })

  it('persists checkbox and select changes', () => {
    const { settings, tab } = createTab()
    const autoOpen = settingRow(tab, 'Open automatically')?.querySelector(
      'input',
    ) as HTMLInputElement
    const density = settingRow(tab, 'Density')?.querySelector(
      'select',
    ) as HTMLSelectElement
    const wrapping = settingRow(tab, 'Wrap long heading labels')?.querySelector(
      'input',
    ) as HTMLInputElement

    autoOpen.checked = true
    autoOpen.dispatchEvent(new Event('change'))
    density.value = 'compact'
    density.dispatchEvent(new Event('change'))
    wrapping.checked = false
    wrapping.dispatchEvent(new Event('change'))

    expect(settings.get('autoOpen')).toBe(true)
    expect(settings.get('density')).toBe('compact')
    expect(settings.get('wrapHeadingLabels')).toBe(false)
  })

  it('keeps the minimum level from exceeding the maximum', () => {
    const { settings, tab } = createTab()
    const minimum = settingRow(tab, 'Minimum heading level')?.querySelector(
      'select',
    ) as HTMLSelectElement

    minimum.value = '6'
    minimum.dispatchEvent(new Event('change'))

    expect(settings.get('minHeadingLevel')).toBe(6)
    expect(settings.get('maxHeadingLevel')).toBe(6)
  })
})
