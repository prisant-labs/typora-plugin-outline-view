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
import { readFileSync } from 'node:fs'

function createTab(parent?: HTMLElement, hostApp?: Record<string, unknown>) {
  const app = {}
  const plugin = new (class extends Plugin<OutlineSettings> {})(
    app as never,
    {
      id: 'prisant-labs.outline-view', name: 'Outline View',
      author: 'Prisant Labs', authorUrl: 'https://github.com/prisant-labs',
      repo: 'prisant-labs/typora-plugin-outline-view', version: '0.3.0',
      dir: 'C:\\plugins\\outline-view',
    } as never,
  )
  const settings = new PluginSettings<OutlineSettings>(
    app as never,
    plugin.manifest,
    { version: 1 },
  )
  settings.setDefault(DEFAULT_OUTLINE_SETTINGS)
  plugin.registerSettings(settings)

  const tab = new OutlineSettingsTab(plugin, hostApp as never)
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
  it('shows the approved compact header with metadata and links in order', () => {
    const { tab } = createTab()
    const header = tab.containerEl.querySelector<HTMLElement>('.outline-view-settings__masthead')!
    expect(tab.containerEl.firstElementChild).toBe(header)
    expect(header.querySelector('h2')?.textContent).toBe('Outline View')
    expect(Array.from(header.querySelectorAll('.outline-view-settings__meta > *')).map(el => el.textContent?.trim())).toEqual([
      'By Prisant Labs', 'Installed 0.3.0', 'Current Unavailable', 'Last updated Unavailable', 'GitHub', 'Local folder',
    ])
    expect(header.querySelector('.outline-view-settings__meta > :last-child')?.classList.contains('outline-view-settings__meta-separated')).toBe(true)
    expect(header.querySelector('.outline-view-settings__meta > :last-child > [data-action="open-plugin-folder"]')).not.toBeNull()
    expect(header.querySelector<HTMLButtonElement>('[data-action="open-plugin-folder"] svg[aria-hidden="true"]')).not.toBeNull()
    expect(header.querySelector<HTMLAnchorElement>('[data-link="author"]')?.href).toBe('https://github.com/prisant-labs')
    expect(header.querySelector<HTMLAnchorElement>('[data-link="github"]')?.href).toBe('https://github.com/prisant-labs/typora-plugin-outline-view')
    expect(header.textContent).not.toMatch(/Release notes|Report an issue|A synchronized outline beside your document/)
    expect(header.nextElementSibling?.tagName).toBe('NAV')
    tab.onhide()
  })

  it('keeps the masthead inside settings despite Typora window header styles', () => {
    const hostStyle = document.createElement('style')
    hostStyle.textContent = 'header { height: 28px; position: fixed; top: 0; left: 0; right: 0; z-index: 900; display: flex; }'
    document.head.append(hostStyle)
    try {
      const { tab } = createTab(document.body)
      const masthead = tab.containerEl.querySelector<HTMLElement>('.outline-view-settings__masthead')!
      expect(masthead.parentElement).toBe(tab.containerEl)
      expect(getComputedStyle(masthead).position).not.toBe('fixed')
      expect(masthead.querySelector('h2')?.textContent).toBe('Outline View')
      tab.onhide()
    } finally {
      hostStyle.remove()
    }
  })

  it('opens the installed plugin folder through the public app API', () => {
    const openFileWithDefaultApp = vi.fn().mockResolvedValue(undefined)
    const host = {
      workspace: { on: () => () => {} }, features: { markdownEditor: { on: () => () => {} } },
      openFileWithDefaultApp,
    }
    const { tab } = createTab(undefined, host)
    tab.containerEl.querySelector<HTMLButtonElement>('[data-action="open-plugin-folder"]')!.click()
    expect(openFileWithDefaultApp).toHaveBeenCalledOnce()
    expect(openFileWithDefaultApp).toHaveBeenCalledWith('C:\\plugins\\outline-view')
    tab.onhide()
  })

  it('reads current version and last update from the latest published release', async () => {
    const host = {
      workspace: { on: () => () => {} }, features: { markdownEditor: { on: () => () => {} } },
      openFileWithDefaultApp: vi.fn(),
      github: { getReleaseInfo: vi.fn().mockResolvedValue({ tag_name: 'v0.3.1', published_at: '2026-09-23T16:00:00Z' }) },
    }
    const { tab } = createTab(undefined, host)
    await vi.waitFor(() => expect(tab.containerEl.querySelector('[data-release-status]')?.textContent).toBe('Update available'))
    expect(tab.containerEl.querySelector('[data-current-version]')?.textContent).toBe('0.3.1')
    expect(tab.containerEl.querySelector('[data-last-updated]')?.textContent).toBe('Sep 23, 2026')
    expect(host.github.getReleaseInfo).toHaveBeenCalledWith('prisant-labs/typora-plugin-outline-view')
    tab.onhide()
  })

  it('shows an unavailable state when the release cannot be checked', async () => {
    const host = {
      workspace: { on: () => () => {} }, features: { markdownEditor: { on: () => () => {} } },
      openFileWithDefaultApp: vi.fn(),
      github: { getReleaseInfo: vi.fn().mockRejectedValue(new Error('offline')) },
    }
    const { tab } = createTab(undefined, host)
    await vi.waitFor(() => expect(tab.containerEl.querySelector('[data-release-status]')?.textContent).toBe('Unable to check'))
    expect(tab.containerEl.querySelector('[data-current-version]')?.textContent).toBe('Unavailable')
    expect(tab.containerEl.querySelector('[data-last-updated]')?.textContent).toBe('Unavailable')
    tab.onhide()
  })

  it('marks the installed published version as up to date', async () => {
    const host = {
      workspace: { on: () => () => {} }, features: { markdownEditor: { on: () => () => {} } },
      github: { getReleaseInfo: vi.fn().mockResolvedValue({ tag_name: '0.3.0', published_at: '2026-09-21T16:00:00Z' }) },
    }
    const { tab } = createTab(undefined, host)
    await vi.waitFor(() => expect(tab.containerEl.querySelector('[data-release-status]')?.textContent).toBe('Up to date'))
    expect(tab.containerEl.querySelector('[data-current-version]')?.textContent).toBe('0.3.0')
    tab.onhide()
  })

  it('does not update a reopened header from a previous release request', async () => {
    let resolveFirst!: (value: unknown) => void
    const first = new Promise(resolve => { resolveFirst = resolve })
    const getReleaseInfo = vi.fn().mockReturnValueOnce(first).mockResolvedValueOnce({ tag_name: '0.3.0', published_at: '2026-09-21T16:00:00Z' })
    const host = {
      workspace: { on: () => () => {} }, features: { markdownEditor: { on: () => () => {} } },
      github: { getReleaseInfo },
    }
    const { tab } = createTab(undefined, host)
    tab.onshow()
    await vi.waitFor(() => expect(tab.containerEl.querySelector('[data-release-status]')?.textContent).toBe('Up to date'))
    resolveFirst({ tag_name: '0.4.0', published_at: '2026-09-23T16:00:00Z' })
    await Promise.resolve()
    expect(tab.containerEl.querySelector('[data-current-version]')?.textContent).toBe('0.3.0')
    tab.onhide()
  })

  it('uses the complete prefixed manual-test hierarchy for samples without touching the document', () => {
    document.body.innerHTML = '<div id="write"><h1>Current document</h1></div>'
    const original = document.querySelector('#write')!.innerHTML
    const { tab } = createTab(document.body)
    const expected = readFileSync('test/vault/heading-level-sample.md', 'utf8')
      .split(/\r?\n/).filter(line => /^#{1,6} /.test(line)).map(line => line.replace(/^#{1,6} /, ''))
    const checkbox = tab.containerEl.querySelector<HTMLInputElement>('.outline-view-settings__preview-meta input')!
    checkbox.click()
    const items = Array.from(tab.containerEl.querySelectorAll('.outline-view--preview .outline-view__item'))
    expect(items.map(item => item.textContent)).toEqual(expected)
    expect(items.map(item => item.getAttribute('data-heading-level'))).toEqual(expected.map(label => label[1]))
    expect(items).toHaveLength(57)
    expect(document.querySelector('#write')!.innerHTML).toBe(original)
    checkbox.click()
    expect(tab.containerEl.querySelectorAll('.outline-view--preview .outline-view__item')).toHaveLength(1)
    tab.onhide()
  })

  it('updates the wrap checkbox and live preview after a toolbar setting change', () => {
    const { tab, settings } = createTab()
    const wrap = tab.containerEl.querySelector<HTMLInputElement>('[data-setting="wrapHeadingLabels"]')!
    settings.set('wrapHeadingLabels', false)
    expect(wrap.checked).toBe(false)
    expect(tab.containerEl.querySelector('.outline-view--preview')!.classList.contains('outline-view--truncate')).toBe(true)
    settings.set('wrapHeadingLabels', true)
    expect(wrap.checked).toBe(true)
    tab.onhide()
  })

  it('previews icons, guides, zebra rows, active paths, current path, sections, and branch focus', () => {
    document.body.innerHTML = '<div id="write"><h1>Field notes</h1><h2>Research</h2><h3>Observations</h3><h4>A familiar pattern</h4><h2>Design direction</h2><h1>Appendix</h1></div>'
    const { tab, settings } = createTab(document.body)
    settings.set('collapseIcon', 'folder')
    settings.set('showVerticalGuides', true)
    settings.set('verticalGuideStrength', 'clear')
    settings.set('zebraRows', true)
    settings.set('sectionSeparation', 'divider')
    settings.set('emphasizeActivePath', true)
    settings.set('showCurrentPathBar', true)
    settings.set('focusCurrentBranch', true)
    const preview = tab.containerEl.querySelector<HTMLElement>('.outline-view--preview')!
    expect(preview.classList).toContain('outline-view--guides')
    expect(preview.classList).toContain('outline-view--guides-clear')
    expect(preview.classList).toContain('outline-view--zebra')
    expect(preview.classList).toContain('outline-view--sections-divider')
    expect(preview.querySelector('svg[data-disclosure-icon="folder"]')).not.toBeNull()
    expect(Array.from(preview.querySelectorAll('.outline-view__current-path button')).map(button => button.textContent)).toEqual(['Field notes', 'Research', 'Observations'])
    expect(Array.from(preview.querySelectorAll('.outline-view__item')).map(button => button.textContent)).toEqual(['Field notes', 'Research', 'Observations', 'A familiar pattern'])
    expect(preview.querySelector('[data-heading-key="heading:0"]')?.parentElement?.classList.contains('is-active-path')).toBe(true)
    tab.onhide()
  })
  it('uses a compact live-view title and metadata row without guidance text', () => {
    document.body.innerHTML = '<div id="write"><h1>Real heading</h1></div>'
    const { tab } = createTab(document.body)
    const preview = tab.containerEl.querySelector('.outline-view-settings__preview')!
    const meta = preview.querySelector('.outline-view-settings__preview-meta')!
    const panel = preview.querySelector('.outline-view--preview')!
    expect(preview.getAttribute('aria-label')).toBe('Live outline view')
    expect(preview.querySelector('h3')!.textContent).toBe('Live outline view')
    expect(preview.textContent).not.toContain('Style changes apply')
    expect(meta.children[0].textContent).toBe('Active document · 1 headings')
    expect(meta.children[1].textContent?.trim()).toBe('Use samples')
    const checkbox = meta.querySelector<HTMLInputElement>('input')!
    checkbox.click()
    expect(meta.children[0].textContent).toBe('Sample outline · H1–H6')
    checkbox.click()
    expect(meta.children[0].textContent).toBe('Active document · 1 headings')
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
    scroll.getBoundingClientRect = () => ({ top: 10, bottom: 10 + height }) as DOMRect
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1200)
    document.body.append(scroll)
    const { tab } = createTab(scroll)
    const preview = tab.containerEl.querySelector<HTMLElement>('.outline-view-settings__preview')!
    expect(preview.style.getPropertyValue('--outline-preview-height')).toBe('696px')
    expect(observe).toHaveBeenCalledWith(scroll)
    height = 600
    resized()
    expect(preview.style.getPropertyValue('--outline-preview-height')).toBe('496px')
    height = 0
    resized()
    expect(preview.style.getPropertyValue('--outline-preview-height')).toBe('496px')
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

  it('leaves a bottom gutter when the card starts below its sticky offset or an ancestor clips it', () => {
    const clip = document.createElement('div')
    clip.style.overflowY = 'hidden'
    Object.defineProperty(clip, 'clientHeight', { value: 650 })
    clip.getBoundingClientRect = () => ({ top: 0, bottom: 650 }) as DOMRect
    const scroll = document.createElement('div')
    scroll.style.cssText = 'overflow-y:auto; padding-bottom:24px'
    Object.defineProperty(scroll, 'clientHeight', { value: 800 })
    scroll.getBoundingClientRect = () => ({ top: 10, bottom: 810 }) as DOMRect
    clip.append(scroll)
    document.body.append(clip)
    const original = HTMLElement.prototype.getBoundingClientRect
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('outline-view-settings__preview')
        ? { top: 100, bottom: 700 } as DOMRect : original.call(this)
    })
    const { tab } = createTab(scroll)
    const preview = tab.containerEl.querySelector<HTMLElement>('.outline-view-settings__preview')!
    expect(preview.style.getPropertyValue('--outline-preview-height')).toBe('514px')
    tab.onhide()
  })

  it('refits the card after scrolling and releases scheduled sizing on hide', () => {
    const scroll = document.createElement('div')
    scroll.style.overflowY = 'auto'
    Object.defineProperty(scroll, 'clientHeight', { value: 600 })
    scroll.getBoundingClientRect = () => ({ top: 10, bottom: 610 }) as DOMRect
    document.body.append(scroll)
    let cardTop = 110
    const original = HTMLElement.prototype.getBoundingClientRect
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('outline-view-settings__preview')
        ? { top: cardTop } as DOMRect : original.call(this)
    })
    const { tab } = createTab(scroll)
    const preview = tab.containerEl.querySelector<HTMLElement>('.outline-view-settings__preview')!
    expect(preview.style.getPropertyValue('--outline-preview-height')).toBe('488px')
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { frames.push(callback); return frames.length })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const remove = vi.spyOn(scroll, 'removeEventListener')
    cardTop = 78
    scroll.dispatchEvent(new Event('scroll'))
    frames.splice(0).forEach(callback => callback(0))
    expect(preview.style.getPropertyValue('--outline-preview-height')).toBe('520px')
    window.dispatchEvent(new Event('resize'))
    tab.onhide()
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(cancel).toHaveBeenCalled()
  })

  it.each(['bold', 'italic', 'underline'] as const)('toggles %s only between selected and unselected, including after reset/reopen', (field) => {
    const { tab, settings } = createTab()
    const button = tab.containerEl.querySelector<HTMLButtonElement>(`[data-field="${field}"]`)!
    expect(button.dataset.state).toBe('off')
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(button.getAttribute('aria-label')).toBe(`H1 ${field}: Off`)
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
    expect(button.dataset.state).toBe('on')
    expect(settings.get('headingStyles')[1][field]).toBe(true)
    tab.onhide()
    tab.onshow()
    expect(tab.containerEl.querySelector(`[data-field="${field}"]`)!.getAttribute('aria-pressed')).toBe('true')
    tab.containerEl.querySelector<HTMLButtonElement>('[data-action="reset-level"]')!.click()
    expect(tab.containerEl.querySelector(`[data-field="${field}"]`)!.getAttribute('aria-pressed')).toBe('false')
    expect(tab.containerEl.querySelector('[aria-pressed="mixed"]')).toBeNull()
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
    expect(tab.containerEl.querySelectorAll('nav.outline-view-settings__nav')).toHaveLength(1)
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
      'Collapse icon',
      'Vertical guides',
      'Guide strength',
      'Guide color',
      'Alternating row colors',
      'Row A color',
      'Row B color',
      'Section separation',
      'Emphasize active path',
      'Show current path bar',
      'Focus current branch',
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

  it('uses native light/dark color swatches, opacity, dependencies, and appearance reset', () => {
    const { settings, tab } = createTab()
    const guides = settingRow(tab, 'Vertical guides')!.querySelector<HTMLInputElement>('input')!
    const strength = settingRow(tab, 'Guide strength')!.querySelector<HTMLSelectElement>('select')!
    const guideRow = settingRow(tab, 'Guide color')!
    const source = guideRow.querySelector<HTMLSelectElement>('select')!
    const details = guideRow.querySelector<HTMLElement>('[data-color-details]')!
    const light = guideRow.querySelector<HTMLInputElement>('[data-color-field="light"]')!
    const dark = guideRow.querySelector<HTMLInputElement>('[data-color-field="dark"]')!
    const same = guideRow.querySelector<HTMLInputElement>('[data-color-field="same"]')!
    const opacity = guideRow.querySelector<HTMLInputElement>('[data-color-field="opacity"]')!
    const opacityNumber = guideRow.querySelector<HTMLInputElement>('[data-color-field="opacity-number"]')!

    expect(light.type).toBe('color')
    expect(dark.type).toBe('color')
    expect(source.value).toBe('theme')
    expect(source.disabled).toBe(true)
    expect(strength.disabled).toBe(true)
    expect(details.hidden).toBe(true)
    guides.checked = true; guides.dispatchEvent(new Event('change'))
    expect(settings.get('showVerticalGuides')).toBe(true)
    expect(source.disabled).toBe(false)
    expect(strength.disabled).toBe(false)
    source.value = 'custom'; source.dispatchEvent(new Event('change'))
    expect(details.hidden).toBe(false)
    light.value = '#123456'; light.dispatchEvent(new Event('input'))
    dark.value = '#abcdef'; dark.dispatchEvent(new Event('input'))
    opacity.value = '42'; opacity.dispatchEvent(new Event('input'))
    expect(opacityNumber.value).toBe('42')
    expect(settings.get('verticalGuideColor')).toEqual({ source: 'custom', light: '#123456', dark: '#abcdef', sameInBothThemes: false, opacity: 42 })
    same.checked = true; same.dispatchEvent(new Event('change'))
    expect(dark.closest('label')?.hidden).toBe(true)
    expect(settings.get('verticalGuideColor').sameInBothThemes).toBe(true)
    opacityNumber.value = '200'; opacityNumber.dispatchEvent(new Event('change'))
    expect(settings.get('verticalGuideColor').opacity).toBe(100)
    expect(opacity.value).toBe('100')

    const zebra = settingRow(tab, 'Alternating row colors')!.querySelector<HTMLInputElement>('input')!
    const zebraA = settingRow(tab, 'Row A color')!.querySelector<HTMLSelectElement>('select')!
    const zebraB = settingRow(tab, 'Row B color')!.querySelector<HTMLSelectElement>('select')!
    expect(zebraA.disabled).toBe(true)
    expect(zebraB.disabled).toBe(true)
    zebra.checked = true; zebra.dispatchEvent(new Event('change'))
    expect(zebraA.disabled).toBe(false)
    expect(zebraB.disabled).toBe(false)

    tab.containerEl.querySelector<HTMLButtonElement>('[data-action="reset-outline-appearance"]')!.click()
    expect(settings.get('showVerticalGuides')).toBe(false)
    expect(settings.get('zebraRows')).toBe(false)
    expect(settings.get('verticalGuideColor')).toEqual(DEFAULT_OUTLINE_SETTINGS.verticalGuideColor)
    expect(source.value).toBe('theme')
    expect(details.hidden).toBe(true)
    tab.onhide()
  })

  it.each([
    ['showVerticalGuides', 'verticalGuideColor'],
    ['zebraRows', 'zebraRowAColor'],
    ['zebraRows', 'zebraRowBColor'],
  ] as const)('hides %s subsettings while preserving %s custom choices', (toggleKey, colorKey) => {
    const { settings, tab } = createTab()
    const group = tab.containerEl.querySelector<HTMLElement>(`[data-settings-group="${toggleKey}"]`)!
    const toggle = tab.containerEl.querySelector<HTMLInputElement>(`[data-setting="${toggleKey}"]`)!
    const source = group.querySelector<HTMLSelectElement>(`[data-setting="${colorKey}"]`)!
    const details = group.querySelector<HTMLElement>(`[data-color-details="${colorKey}"]`)!
    expect(group.hidden).toBe(true)
    expect(toggle.getAttribute('aria-controls')).toBe(group.id)
    expect(group.contains(toggle)).toBe(false)
    expect(details.parentElement).toBe(source.closest('.typ-setting-item'))
    expect(source.parentElement!.children).toHaveLength(1)

    toggle.checked = true; toggle.dispatchEvent(new Event('change'))
    expect(group.hidden).toBe(false)
    source.value = 'custom'; source.dispatchEvent(new Event('change'))
    const light = details.querySelector<HTMLInputElement>('[data-color-field="light"]')!
    const dark = details.querySelector<HTMLInputElement>('[data-color-field="dark"]')!
    const same = details.querySelector<HTMLInputElement>('[data-color-field="same"]')!
    light.value = '#123456'; light.dispatchEvent(new Event('input'))
    dark.value = '#abcdef'; dark.dispatchEvent(new Event('input'))
    same.checked = true; same.dispatchEvent(new Event('change'))
    expect(dark.disabled).toBe(true)
    expect(dark.closest('label')!.hidden).toBe(true)
    const saved = settings.get(colorKey)

    toggle.checked = false; toggle.dispatchEvent(new Event('change'))
    expect(group.hidden).toBe(true)
    expect(details.hidden).toBe(true)
    expect(Array.from(group.querySelectorAll('input, select')).every(input => (input as HTMLInputElement).disabled)).toBe(true)
    expect(settings.get(colorKey)).toEqual(saved)
    toggle.checked = true; toggle.dispatchEvent(new Event('change'))
    expect(details.hidden).toBe(false)
    expect(light.value).toBe('#123456')
    same.checked = false; same.dispatchEvent(new Event('change'))
    expect(dark.disabled).toBe(false)
    expect(dark.closest('label')!.hidden).toBe(false)
    expect(dark.value).toBe('#abcdef')
    tab.onhide()
    tab.onshow()
    expect(tab.containerEl.querySelector<HTMLElement>(`[data-settings-group="${toggleKey}"]`)!.hidden).toBe(false)
    expect(tab.containerEl.querySelector<HTMLSelectElement>(`[data-setting="${colorKey}"]`)!.value).toBe('custom')
    tab.onhide()
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
    expect(tab.containerEl.querySelector<HTMLElement>('[data-settings-group="showLevelSelector"]')!.hidden).toBe(true)
    expect(tab.containerEl.querySelector<HTMLElement>('.outline-view-settings__preview .outline-view__level-selector')!.hidden).toBe(true)
    tab.onhide()
    document.body.replaceChildren()
    tab.onshow()
    expect(tab.containerEl.querySelector('.outline-view-settings__preview')!.textContent).toContain('Sample outline')
    expect(tab.containerEl.querySelectorAll('.outline-view-settings__preview .outline-view__item')).toHaveLength(57)
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
