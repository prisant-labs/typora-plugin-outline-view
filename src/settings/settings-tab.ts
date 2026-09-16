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
    help.textContent = 'Size is relative to the theme-scaled outline font (50–250%). B, I and U cycle Theme → On → Off. Colors and case affect only outline labels.'
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
    this.preview = new OutlinePreview()
    this.previewVisible = true
    const layout = document.createElement('div')
    layout.className = 'outline-view-settings__layout'
    layout.append(controls, this.preview.element)
    this.containerEl.append(layout)
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
      })
      visibility.observe(this.containerEl)
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

  private sync() {
    const settings = readOutlineSettings(this.outlinePlugin.settings)
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
        this.changeStyle(level, { [field]: value === null ? true : value === true ? false : null })
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
        const state = style[field] === null ? 'Theme' : style[field] ? 'On' : 'Off'
        button.setAttribute('aria-pressed', style[field] === null ? 'mixed' : String(style[field]))
        button.setAttribute('aria-label', 'H' + level + ' ' + field + ': ' + state)
        button.title = field + ': ' + state + '. Click to cycle Theme, On, Off.'
      }
      row.querySelector<HTMLSelectElement>('[data-field="casing"]')!.value = style.casing
      row.querySelector<HTMLSelectElement>('[data-field="color-mode"]')!.value = style.color ? 'custom' : 'theme'
      const color = row.querySelector<HTMLInputElement>('[data-field="color"]')!
      color.disabled = !style.color
      if (style.color) color.value = style.color
    }
  }
}
