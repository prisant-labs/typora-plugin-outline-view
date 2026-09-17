import {
  Plugin,
  PluginSettings,
} from '@typora-community-plugin/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_OUTLINE_SETTINGS,
  type OutlineSettings,
} from './model'
import { OutlineSettingsTab } from './settings-tab'

function createTab(parent?: HTMLElement) {
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
  parent?.append(tab.containerEl)
  tab.onshow()
  return { plugin, settings, tab }
}

function settingRow(tab: OutlineSettingsTab, name: string) {
  return Array.from(tab.containerEl.querySelectorAll('.typ-setting-item')).find(
    (row) => row.querySelector('.typ-setting-name')?.textContent?.trim() === name,
  ) as HTMLElement | undefined
}

describe('OutlineSettingsTab', () => {
  it('puts the concise preview guidance above the outline, not below it', () => {
    const { tab } = createTab()
    const preview = tab.containerEl.querySelector('.outline-view-settings__preview')!
    const help = preview.querySelector('.outline-view-settings__preview-help')!
    const panel = preview.querySelector('.outline-view--preview')!
    expect(help.textContent).toBe('Style changes apply immediately. Use this preview for quick visual experimentation.')
    expect(help.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(preview.lastElementChild).toBe(panel)
    tab.onhide()
  })

  it('fits the wide preview to its scroll viewport and tracks viewport resizing', () => {
    let resized!: () => void
    const observe = vi.fn()
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) { resized = callback }
      observe = observe
      disconnect = disconnect
    })
    const scroll = document.createElement('div')
    scroll.style.cssText = 'overflow-y:auto; padding:20px 0 24px'
    let height = 800
    Object.defineProperty(scroll, 'clientHeight', { get: () => height })
    document.body.append(scroll)
    const { tab } = createTab(scroll)
    const preview = tab.containerEl.querySelector<HTMLElement>('.outline-view-settings__preview')!
    expect(preview.style.getPropertyValue('--outline-preview-height')).toBe('688px')
    expect(observe).toHaveBeenCalledWith(scroll)
    height = 600
    resized()
    expect(preview.style.getPropertyValue('--outline-preview-height')).toBe('488px')
    height = 0
    resized()
    expect(preview.style.getPropertyValue('--outline-preview-height')).toBe('488px')
    tab.onhide()
    expect(disconnect).toHaveBeenCalledOnce()
  })

  it('hides theme color swatches, shows custom color, and hides them again on reset', () => {
    const { tab } = createTab()
    const row = tab.containerEl.querySelector('[data-appearance-level="1"]')!
    const color = row.querySelector<HTMLInputElement>('[data-field="color"]')!
    const mode = row.querySelector<HTMLSelectElement>('[data-field="color-mode"]')!
    expect(color.hidden).toBe(true)
    expect(color.disabled).toBe(true)
    mode.value = 'custom'
    mode.dispatchEvent(new Event('change'))
    expect(color.hidden).toBe(false)
    expect(color.disabled).toBe(false)
    row.querySelector<HTMLButtonElement>('[data-action="reset-level"]')!.click()
    expect(color.hidden).toBe(true)
    expect(mode.value).toBe('theme')
    tab.onhide()
  })

  it.each(['bold', 'italic', 'underline'])('keeps %s Theme, On and Off named through the complete cycle', (field) => {
    const { tab } = createTab()
    const button = tab.containerEl.querySelector<HTMLButtonElement>(`[data-field="${field}"]`)!
    expect(button.dataset.state).toBe('theme')
    expect(button.getAttribute('aria-pressed')).toBe('mixed')
    expect(button.getAttribute('aria-label')).toBe(`H1 ${field}: Theme`)
    expect(button.title).toContain('Theme')
    button.click()
    expect(button.dataset.state).toBe('on')
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(button.getAttribute('aria-label')).toBe(`H1 ${field}: On`)
    expect(button.title).toContain(': On.')
    button.click()
    expect(button.dataset.state).toBe('off')
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(button.getAttribute('aria-label')).toBe(`H1 ${field}: Off`)
    expect(button.title).toContain(': Off.')
    button.click()
    expect(button.dataset.state).toBe('theme')
    tab.onhide()
  })

  it('provides section links that scroll and focus the target without changing settings', () => {
    const { tab, settings } = createTab()
    document.body.append(tab.containerEl)
    const nav = tab.containerEl.querySelector('nav[aria-label="Outline View settings sections"]')
    expect(nav).not.toBeNull()
    const links = Array.from(nav!.querySelectorAll('a'))
    expect(links.map(link => link.textContent)).toEqual(['General', 'Behavior', 'Structure', 'Appearance', 'Selector', 'Heading styles'])
    const target = tab.containerEl.querySelector<HTMLElement>('#outline-settings-heading-styles')!
    target.scrollIntoView = vi.fn()
    links[5].click()
    expect(target.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' })
    expect(document.activeElement).toBe(target)
    expect(links[5].getAttribute('aria-current')).toBe('location')
    expect(links.filter(link => link.hasAttribute('aria-current'))).toHaveLength(1)
    expect(settings.get('headingStyles')).toEqual(DEFAULT_OUTLINE_SETTINGS.headingStyles)
    tab.onhide()
    tab.onshow()
    expect(tab.containerEl.querySelectorAll('nav')).toHaveLength(1)
    tab.onhide()
  })

  it('removes section scroll tracking and cancels queued work when hidden', () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const frame = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42)
    const { tab } = createTab()
    document.dispatchEvent(new Event('scroll'))
    expect(frame).toHaveBeenCalled()
    tab.onhide()
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function), true)
    expect(cancel).toHaveBeenCalledWith(42)
  })

  it('marks the last section current at the bottom even when it cannot reach the sticky bar', () => {
    const { tab } = createTab()
    const scroll = document.createElement('div')
    scroll.style.overflowY = 'auto'
    scroll.append(tab.containerEl)
    document.body.append(scroll)
    Object.defineProperties(scroll, { scrollHeight: { value: 1800 }, clientHeight: { value: 800 } })
    scroll.scrollTop = 1000
    tab.containerEl.getClientRects = () => ({ length: 1 }) as DOMRectList
    tab.containerEl.querySelector('nav')!.getBoundingClientRect = () => ({ bottom: 53 }) as DOMRect
    tab.containerEl.querySelectorAll('section.outline-view-settings__section').forEach((section, index) => {
      section.getBoundingClientRect = () => ({ top: index === 5 ? 200 : -500 + index * 100 }) as DOMRect
    })
    let frame!: FrameRequestCallback
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { frame = callback; return 1 })
    scroll.dispatchEvent(new Event('scroll'))
    frame(0)
    expect(tab.containerEl.querySelector('nav [aria-current]')!.textContent).toBe('Heading styles')
    tab.onhide()
  })
  it('refreshes after modal reopen even when core does not call onshow again', () => {
    let resized!: () => void
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) { resized = callback }
      observe() {}
      disconnect = disconnect
    })
    document.body.innerHTML = '<div id="write"><h1>Before</h1></div>'
    const { tab, settings } = createTab()
    let visible = true
    tab.containerEl.getClientRects = () => ({ length: visible ? 1 : 0 }) as DOMRectList
    resized()
    visible = false
    resized()
    document.querySelector('h1')!.textContent = 'After'
    settings.set('density', 'compact')
    expect(tab.containerEl.querySelector('.outline-view__item')!.textContent).toBe('Before')
    visible = true
    resized()
    expect(tab.containerEl.querySelector('.outline-view__item')!.textContent).toBe('After')
    tab.onhide()
    expect(disconnect).toHaveBeenCalledOnce()
    vi.unstubAllGlobals()
  })
  it('pairs the size slider with its numeric value and clamps committed values', () => {
    const { settings, tab } = createTab()
    const row = tab.containerEl.querySelector('[data-appearance-level="3"]')!
    const slider = row.querySelector<HTMLInputElement>('input[type="range"]')!
    const number = row.querySelector<HTMLInputElement>('input[type="number"]')!
    expect(slider).not.toBeNull()
    slider.value = '175'
    slider.dispatchEvent(new Event('input'))
    expect(number.value).toBe('175')
    expect(settings.get('headingStyles')[3].size).toBe(175)
    number.value = '300'
    number.dispatchEvent(new Event('change'))
    expect(number.value).toBe('250')
    expect(slider.value).toBe('250')
    tab.onhide()
  })
  it('uses the manifest name and renders every approved setting', () => {
    const { tab } = createTab()

    expect(tab.name).toBe('Outline View')
    expect(tab.containerEl.classList.contains('outline-view-settings')).toBe(true)
    expect(
      Array.from(tab.containerEl.querySelectorAll('.typ-setting-name')).map(
        (name) => name.textContent?.trim(),
      ),
    ).toEqual(expect.arrayContaining([
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
      'Show heading-level selector',
      'Selector style',
      'Show heading-level labels',
      'Color theme',
    ]))
  })

  it('shows the approved defaults', () => {
    const { tab } = createTab()
    const checkboxes = Array.from(
      tab.containerEl.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    )
    const selects = Array.from(
      tab.containerEl.querySelectorAll<HTMLSelectElement>('select'),
    )

    expect(checkboxes[0].checked).toBe(false)
    expect(selects.map(({ value }) => value)).toEqual(expect.arrayContaining(['1', '6', '3', 'comfortable', 'medium', 'rail', 'theme']))
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

  it('previews size, emphasis, casing and color immediately and resets each level', () => {
    const { settings, tab } = createTab()
    const row = tab.containerEl.querySelector<HTMLElement>('[data-appearance-level="2"]')!
    const size = row.querySelector<HTMLInputElement>('[data-field="size"]')!
    size.value = '150'
    size.dispatchEvent(new Event('input'))
    row.querySelector<HTMLButtonElement>('[data-field="bold"]')!.click()
    const casing = row.querySelector<HTMLSelectElement>('[data-field="casing"]')!
    casing.value = 'small-caps'
    casing.dispatchEvent(new Event('change'))
    const mode = row.querySelector<HTMLSelectElement>('[data-field="color-mode"]')!
    mode.value = 'custom'
    mode.dispatchEvent(new Event('change'))
    const color = row.querySelector<HTMLInputElement>('input[type="color"]')!
    color.value = '#336699'
    color.dispatchEvent(new Event('input'))
    expect(settings.get('headingStyles')[2]).toMatchObject({ size: 150, bold: true, casing: 'small-caps', color: '#336699' })
    const preview = tab.containerEl.querySelector<HTMLElement>('.outline-view-settings__preview [data-heading-level="2"]')!
    expect(preview.style.getPropertyValue('--outline-heading-color')).toBe('#336699')
    expect(preview.style.fontVariantCaps).toBe('small-caps')
    expect(preview.parentElement!.style.fontSize).toBe('150%')
    row.querySelector<HTMLButtonElement>('[data-action="reset-level"]')!.click()
    expect(settings.get('headingStyles')[2]).toEqual(DEFAULT_OUTLINE_SETTINGS.headingStyles[2])
    tab.onhide()
  })

  it('uses active-document headings, falls back to samples, and disables dependent selector settings', () => {
    document.body.innerHTML = '<div id="write"><h1>Current document</h1><h3>Real heading</h3></div>'
    const { tab } = createTab()
    expect(tab.containerEl.querySelector('.outline-view-settings__preview')!.textContent).toContain('Real heading')
    const show = settingRow(tab, 'Show heading-level selector')!.querySelector<HTMLInputElement>('input')!
    show.checked = false
    show.dispatchEvent(new Event('change'))
    expect(settingRow(tab, 'Selector style')!.querySelector<HTMLSelectElement>('select')!.disabled).toBe(true)
    expect(tab.containerEl.querySelector<HTMLElement>('.outline-view-settings__preview .outline-view__level-selector')!.hidden).toBe(true)
    tab.onhide()
    document.body.replaceChildren()
    tab.onshow()
    expect(tab.containerEl.querySelector('.outline-view-settings__preview')!.textContent).toContain('Sample outline')
    expect(tab.containerEl.querySelectorAll('.outline-view-settings__preview .outline-view__item')).toHaveLength(6)
    tab.onhide()
  })

  it('cleans up subscriptions and old preview when shown repeatedly or hidden', () => {
    const { tab, settings } = createTab()
    tab.onshow()
    expect(tab.containerEl.querySelectorAll('.outline-view-settings__preview')).toHaveLength(1)
    const oldPreview = tab.containerEl.querySelector('.outline-view-settings__preview')!
    tab.onhide()
    const oldHTML = oldPreview.innerHTML
    settings.set('maxHeadingLevel', 1)
    expect(oldPreview.innerHTML).toBe(oldHTML)
  })
})

afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals() })
