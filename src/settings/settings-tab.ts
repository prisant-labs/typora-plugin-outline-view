import { SettingTab, type App, type Plugin, type SettingItem } from '@typora-community-plugin/core'
import type { HeadingLevel } from '../outline/model'
import { createDebouncedTask } from '../outline/scheduler'
import {
  HEADING_LEVEL_OPTIONS, normalizeOutlineSettings, readOutlineSettings,
  defaultHeadingAppearance, type HeadingAppearance, type OutlineSettings,
} from './model'
import { OutlinePreview } from './preview'

type SettingKey = keyof OutlineSettings
type Options = Array<readonly [string, string]>

export class OutlineSettingsTab extends SettingTab {
  private preview?: OutlinePreview
  private disposables: Array<() => void> = []
  private dependent: Array<HTMLInputElement | HTMLSelectElement> = []
  private appearanceRows = new Map<HeadingLevel, HTMLElement>()
  private previewVisible = true

  constructor(private readonly outlinePlugin: Plugin<OutlineSettings>, private readonly app?: App) {
    super()
    this.containerEl.classList.add('outline-view-settings')
  }

  get name() { return this.outlinePlugin.manifest.name }

  onshow() {
    this.onhide()
    this.containerEl.replaceChildren()
    this.dependent = []
    this.appearanceRows.clear()
    const s = readOutlineSettings(this.outlinePlugin.settings)
    this.addSettingTitle('General')
    this.addCheckbox('Open automatically', 'Open Outline View when the plugin loads.', 'autoOpen', s.autoOpen)
    this.addSettingTitle('Behavior')
    this.addCheckbox('Follow active heading', 'Highlight the heading for the current editor position.', 'followActiveHeading', s.followActiveHeading)
    this.addCheckbox('Auto-scroll outline', 'Keep the active heading visible inside the outline.', 'autoScrollOutline', s.autoScrollOutline)
    this.addCheckbox('Remember collapse state during the session', 'Restore branch choices when switching between open files.', 'rememberCollapseState', s.rememberCollapseState)
    this.addSettingTitle('Structure')
    const levels = HEADING_LEVEL_OPTIONS.map(level => [String(level), 'H' + level] as const)
    this.addSelect('Minimum heading level', 'Default start level. Updating defaults resets temporary document ranges.', 'minHeadingLevel', s.minHeadingLevel, levels, true)
    this.addSelect('Maximum heading level', 'Default end level. Start and end may be the same level.', 'maxHeadingLevel', s.maxHeadingLevel, levels, true)
    this.addSelect('Expand by default through', 'Show this level initially; branches at this level start collapsed.', 'expandThroughLevel', s.expandThroughLevel, levels, true)
    this.addSettingTitle('Appearance')
    this.addCheckbox('Wrap long heading labels', 'Show long headings on multiple lines instead of truncating them.', 'wrapHeadingLabels', s.wrapHeadingLabels)
    this.addSelect('Density', 'Choose the vertical spacing between outline rows.', 'density', s.density, [['compact', 'Compact'], ['comfortable', 'Comfortable']])
    this.addSelect('Indentation', 'Choose the horizontal spacing between nested levels.', 'indentation', s.indentation, [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']])
    this.addSettingTitle('Heading-level selector')
    this.addCheckbox('Show heading-level selector', 'Show the quick range control beneath the outline toolbar.', 'showLevelSelector', s.showLevelSelector)
    this.addSelect('Selector style', 'Choose the range control appearance.', 'selectorStyle', s.selectorStyle, [['rail', 'Rail'], ['enclosure', 'Enclosure'], ['bracket', 'Bracket']], false, true)
    this.addCheckbox('Show heading-level labels', 'Show H1–H6 labels. Turn off for dots only.', 'selectorLabels', s.selectorLabels, true)
    this.addSelect('Color theme', 'Use the current theme accent or neutral text and border colors.', 'selectorColor', s.selectorColor, [['theme', 'Theme'], ['grayscale', 'Grayscale']], false, true)
    this.addSettingTitle('Heading styles')
    const help = document.createElement('p')
    help.className = 'outline-view-settings__help'
    help.textContent = 'Size is relative to the theme-scaled outline font (50–250%). B, I and U toggle on (filled) or off (outlined). Colors and case affect only outline labels.'
    this.containerEl.append(help)
    for (const level of HEADING_LEVEL_OPTIONS) this.addAppearanceRow(level)
    const resetAll = document.createElement('button')
    resetAll.type = 'button'
    resetAll.textContent = 'Reset all heading styles'
    resetAll.dataset.action = 'reset-all-styles'
    resetAll.addEventListener('click', () => {
      this.persist({ headingStyles: normalizeOutlineSettings().headingStyles })
      this.syncAppearanceRows()
    })
    this.containerEl.append(resetAll)
    const controls = document.createElement('div')
    controls.className = 'outline-view-settings__controls'
    controls.append(...Array.from(this.containerEl.childNodes))
    const navigation = this.addSectionNavigation(controls)
    this.preview = new OutlinePreview()
    this.previewVisible = true
    const layout = document.createElement('div')
    layout.className = 'outline-view-settings__layout'
    layout.append(controls, this.preview.element)
    this.containerEl.append(navigation, layout)
    const scroll = this.scrollParent()
    const sizePreview = () => {
      if (!scroll?.clientHeight || !this.preview) return
      const padding = getComputedStyle(scroll)
      const scrollTop = scroll.getBoundingClientRect().top + scroll.clientTop
      const stickyTop = Number.parseFloat(getComputedStyle(this.preview.element).top) || 68
      // The card may start below the sticky offset before the settings scroll.
      const top = Math.max(this.preview.element.getBoundingClientRect().top, scrollTop + stickyTop)
      let bottom = Math.min(scrollTop + scroll.clientHeight, window.innerHeight)
      // A host modal may clip the scrollport. Respect that visible boundary too.
      for (let parent = scroll.parentElement; parent; parent = parent.parentElement) {
        if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(parent).overflowY) && parent.clientHeight) {
          bottom = Math.min(bottom, parent.getBoundingClientRect().top + parent.clientTop + parent.clientHeight)
        }
      }
      const height = Math.max(0, bottom - top - (Number.parseFloat(padding.paddingBottom) || 0) - 12)
      this.preview.element.style.setProperty('--outline-preview-height', `${height}px`)
    }
    sizePreview()
    let sizeFrame = 0
    const scheduleSize = () => {
      if (!sizeFrame) sizeFrame = window.requestAnimationFrame(() => { sizeFrame = 0; sizePreview() })
    }
    scroll?.addEventListener('scroll', scheduleSize)
    window.addEventListener('resize', scheduleSize)
    this.disposables.push(() => {
      scroll?.removeEventListener('scroll', scheduleSize)
      window.removeEventListener('resize', scheduleSize)
      if (sizeFrame) window.cancelAnimationFrame(sizeFrame)
    })
    this.disposables.push(this.outlinePlugin.settings.onChange('*', () => this.sync()))
    if (this.app) {
      const refresh = createDebouncedTask(() => {
        if (this.containerEl.getClientRects().length) this.preview?.refresh()
      }, 120)
      this.disposables.push(
        this.app.workspace.on('file:open', refresh.schedule),
        this.app.features.markdownEditor.on('load', refresh.schedule),
        this.app.features.markdownEditor.on('edit', refresh.schedule),
        refresh.cancel,
      )
    }
    // Core 2.10.21 does not call onhide/onshow on modal close/reopen. Observe our
    // own container, without reaching into the framework's private Modal.
    if (typeof ResizeObserver !== 'undefined') {
      const visibility = new ResizeObserver(() => {
        const visible = this.containerEl.getClientRects().length > 0
        if (visible && !this.previewVisible) {
          this.previewVisible = true
          this.sync()
        } else if (!visible) this.preview?.suspend()
        this.previewVisible = visible
        sizePreview()
      })
      visibility.observe(this.containerEl)
      if (scroll) visibility.observe(scroll)
      this.disposables.push(() => visibility.disconnect())
    }
    this.syncAppearanceRows()
    this.sync()
  }

  onhide() {
    this.disposables.splice(0).forEach(dispose => dispose())
    this.preview?.destroy()
    this.preview = undefined
  }

  private scrollParent() {
    let parent = this.containerEl.parentElement
    while (parent) {
      if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) return parent
      parent = parent.parentElement
    }
    return undefined
  }

  private addSectionNavigation(controls: HTMLElement) {
    const nav = document.createElement('nav')
    nav.className = 'outline-view-settings__nav'
    nav.setAttribute('aria-label', 'Outline View settings sections')
    const sections: HTMLElement[] = []
    const links: HTMLAnchorElement[] = []
    let current: HTMLElement | undefined
    const select = (index: number) => links.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
    })
    for (const child of Array.from(controls.children)) {
      const title = child.querySelector<HTMLElement>('.typ-setting-title')
      if (title) {
        const name = title.textContent ?? ''
        const slug = name === 'Heading-level selector' ? 'selector' : name.toLowerCase().replaceAll(' ', '-')
        current = document.createElement('section')
        current.id = 'outline-settings-' + slug
        current.className = 'outline-view-settings__section'
        current.tabIndex = -1
        title.id = current.id + '-title'
        current.setAttribute('aria-labelledby', title.id)
        controls.append(current)
        const index = sections.push(current) - 1
        const target = current
        const link = document.createElement('a')
        link.href = '#' + target.id
        link.textContent = slug === 'selector' ? 'Selector' : name
        const navigate = (event: Event) => {
          event.preventDefault()
          const scroll = this.scrollParent()
          if (scroll) {
            const offset = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 72
            scroll.scrollTo({ top: scroll.scrollTop + target.getBoundingClientRect().top - scroll.getBoundingClientRect().top - offset, behavior: 'instant' })
          } else target.scrollIntoView({ block: 'start', behavior: 'instant' })
          target.focus({ preventScroll: true })
          select(index)
        }
        link.addEventListener('click', navigate)
        this.disposables.push(() => link.removeEventListener('click', navigate))
        links.push(link)
        nav.append(link)
      }
      current?.append(child)
    }
    select(0)
    let frame = 0
    const update = () => {
      frame = 0
      if (!this.containerEl.getClientRects().length) return
      const offset = Number.parseFloat(getComputedStyle(sections[0]).scrollMarginTop) || 72
      const edge = nav.getBoundingClientRect().top + offset + 2
      let active = 0
      sections.forEach((section, index) => {
        if (section.getBoundingClientRect().top <= edge) active = index
      })
      const scroll = this.scrollParent()
      if (scroll && scroll.scrollHeight > scroll.clientHeight && scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 2) active = sections.length - 1
      select(active)
    }
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update) }
    document.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    this.disposables.push(() => {
      document.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
      if (frame) window.cancelAnimationFrame(frame)
    })
    return nav
  }

  private sync() {
    const settings = readOutlineSettings(this.outlinePlugin.settings)
    const wrap = this.containerEl.querySelector<HTMLInputElement>('[data-setting="wrapHeadingLabels"]')
    if (wrap) wrap.checked = settings.wrapHeadingLabels
    this.dependent.forEach(input => { input.disabled = !settings.showLevelSelector })
    for (const key of ['minHeadingLevel', 'maxHeadingLevel'] as const) {
      const input = this.containerEl.querySelector<HTMLSelectElement>('[data-setting="' + key + '"]')
      if (input) input.value = String(settings[key])
    }
    if (this.previewVisible) this.preview?.update(settings)
  }

  private persist(patch: Partial<OutlineSettings>) {
    const current = readOutlineSettings(this.outlinePlugin.settings)
    const next = normalizeOutlineSettings({ ...current, ...patch })
    for (const key of Object.keys(next) as SettingKey[]) {
      if (JSON.stringify(next[key]) !== JSON.stringify(current[key])) this.outlinePlugin.settings.set(key, next[key])
    }
    this.sync()
  }

  private addCheckbox(name: string, description: string, key: SettingKey, checked: boolean, dependent = false) {
    this.addSetting((setting: SettingItem) => {
      setting.addName(name)
      setting.addDescription(description)
      setting.addCheckbox(input => {
        input.checked = checked
        input.dataset.setting = key
        input.setAttribute('aria-label', name)
        if (dependent) this.dependent.push(input)
        input.addEventListener('change', () => this.persist({ [key]: input.checked }))
      })
    })
  }

  private addSelect(name: string, description: string, key: SettingKey, selected: string | number, options: Options, numeric = false, dependent = false) {
    this.addSetting((setting: SettingItem) => {
      setting.addName(name)
      setting.addDescription(description)
      setting.addSelect(input => {
        this.addOptions(input, options)
        input.value = String(selected)
        input.dataset.setting = key
        input.setAttribute('aria-label', name)
        if (dependent) this.dependent.push(input)
        input.addEventListener('change', () => this.persist({ [key]: numeric ? Number(input.value) : input.value }))
      })
    })
  }

  private addOptions(input: HTMLSelectElement, options: Options) {
    for (const [value, text] of options) {
      const option = document.createElement('option')
      option.value = value
      option.textContent = text
      input.append(option)
    }
  }

  private changeStyle(level: HeadingLevel, patch: Partial<HeadingAppearance>) {
    const styles = readOutlineSettings(this.outlinePlugin.settings).headingStyles
    this.persist({ headingStyles: { ...styles, [level]: { ...styles[level], ...patch } } })
  }

  private addAppearanceRow(level: HeadingLevel) {
    const row = document.createElement('div')
    row.className = 'outline-view-settings__heading-style'
    row.dataset.appearanceLevel = String(level)
    row.setAttribute('role', 'group')
    row.setAttribute('aria-label', 'H' + level + ' appearance')
    const name = document.createElement('strong')
    name.textContent = 'H' + level
    const sizeLabel = document.createElement('label')
    const size = document.createElement('input')
    size.type = 'number'
    size.min = '50'; size.max = '250'; size.step = '5'
    size.dataset.field = 'size'
    size.setAttribute('aria-label', 'H' + level + ' font size percent')
    size.addEventListener('input', () => {
      const value = size.valueAsNumber
      if (Number.isFinite(value) && value >= 50 && value <= 250) {
        this.changeStyle(level, { size: value })
        slider.value = String(readOutlineSettings(this.outlinePlugin.settings).headingStyles[level].size)
      }
    })
    size.addEventListener('change', () => {
      if (Number.isFinite(size.valueAsNumber)) this.changeStyle(level, { size: size.valueAsNumber })
      this.syncAppearanceRows()
    })
    sizeLabel.append(size, ' %')
    const slider = document.createElement('input')
    slider.type = 'range'
    slider.min = '50'; slider.max = '250'; slider.step = '5'
    slider.dataset.field = 'size-slider'
    slider.setAttribute('aria-label', 'H' + level + ' font size slider')
    slider.addEventListener('input', () => {
      this.changeStyle(level, { size: slider.valueAsNumber })
      size.value = slider.value
    })
    row.append(name, slider, sizeLabel)
    for (const [field, text] of [['bold', 'B'], ['italic', 'I'], ['underline', 'U']] as const) {
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.field = field
      button.textContent = text
      button.addEventListener('click', () => {
        const value = readOutlineSettings(this.outlinePlugin.settings).headingStyles[level][field]
        this.changeStyle(level, { [field]: !value })
        this.syncAppearanceRows()
      })
      row.append(button)
    }
    const casing = document.createElement('select')
    casing.dataset.field = 'casing'
    casing.setAttribute('aria-label', 'H' + level + ' letter case')
    this.addOptions(casing, [['normal', 'Normal'], ['uppercase', 'ALL CAPS'], ['small-caps', 'Small Caps']])
    casing.addEventListener('change', () => this.changeStyle(level, { casing: casing.value as HeadingAppearance['casing'] }))
    const colorMode = document.createElement('select')
    colorMode.dataset.field = 'color-mode'
    colorMode.setAttribute('aria-label', 'H' + level + ' color source')
    this.addOptions(colorMode, [['theme', 'Theme'], ['custom', 'Custom color']])
    const color = document.createElement('input')
    color.type = 'color'
    color.dataset.field = 'color'
    color.setAttribute('aria-label', 'H' + level + ' custom color')
    color.addEventListener('input', () => this.changeStyle(level, { color: color.value }))
    color.addEventListener('change', () => this.changeStyle(level, { color: color.value }))
    colorMode.addEventListener('change', () => {
      this.changeStyle(level, { color: colorMode.value === 'custom' ? color.value : null })
      this.syncAppearanceRows()
    })
    const reset = document.createElement('button')
    reset.type = 'button'
    reset.textContent = 'Reset'
    reset.dataset.action = 'reset-level'
    reset.setAttribute('aria-label', 'Reset H' + level + ' appearance')
    reset.addEventListener('click', () => { this.changeStyle(level, defaultHeadingAppearance()); this.syncAppearanceRows() })
    row.append(casing, colorMode, color, reset)
    this.appearanceRows.set(level, row)
    this.containerEl.append(row)
  }

  private syncAppearanceRows() {
    const styles = readOutlineSettings(this.outlinePlugin.settings).headingStyles
    for (const [level, row] of this.appearanceRows) {
      const style = styles[level]
      row.querySelector<HTMLInputElement>('[data-field="size"]')!.value = String(style.size)
      row.querySelector<HTMLInputElement>('[data-field="size-slider"]')!.value = String(style.size)
      for (const field of ['bold', 'italic', 'underline'] as const) {
        const button = row.querySelector<HTMLButtonElement>('[data-field="' + field + '"]')!
        const state = style[field] ? 'On' : 'Off'
        button.dataset.state = state.toLowerCase()
        button.setAttribute('aria-pressed', String(style[field]))
        button.setAttribute('aria-label', 'H' + level + ' ' + field + ': ' + state)
        button.title = field + ': ' + state + '. Click to turn ' + (style[field] ? 'off' : 'on') + '.'
      }
      row.querySelector<HTMLSelectElement>('[data-field="casing"]')!.value = style.casing
      row.querySelector<HTMLSelectElement>('[data-field="color-mode"]')!.value = style.color ? 'custom' : 'theme'
      const color = row.querySelector<HTMLInputElement>('[data-field="color"]')!
      color.disabled = !style.color
      color.hidden = !style.color
      if (style.color) color.value = style.color
    }
  }
}
