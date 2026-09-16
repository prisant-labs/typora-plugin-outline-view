import {
  SettingTab,
  type Plugin,
  type SettingItem,
} from '@typora-community-plugin/core'

import {
  DENSITY_OPTIONS,
  HEADING_LEVEL_OPTIONS,
  INDENTATION_OPTIONS,
  normalizeOutlineSettings,
  type OutlineSettings,
} from './model'

type SettingKey = keyof OutlineSettings

const DENSITY_LABELS = {
  compact: 'Compact',
  comfortable: 'Comfortable',
} as const

const INDENTATION_LABELS = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
} as const

export class OutlineSettingsTab extends SettingTab {
  constructor(
    private readonly outlinePlugin: Plugin<OutlineSettings>,
  ) {
    super()
    this.containerEl.classList.add('outline-view-settings')
  }

  get name() {
    return this.outlinePlugin.manifest.name
  }

  onshow() {
    this.containerEl.replaceChildren()
    const settings = this.currentSettings()

    this.addSettingTitle('General')
    this.addCheckbox(
      'Open automatically',
      'Open Outline View when the plugin loads.',
      'autoOpen',
      settings.autoOpen,
    )

    this.addSettingTitle('Behavior')
    this.addCheckbox(
      'Follow active heading',
      'Highlight the heading for the current editor position.',
      'followActiveHeading',
      settings.followActiveHeading,
    )
    this.addCheckbox(
      'Auto-scroll outline',
      'Keep the active heading visible inside the outline.',
      'autoScrollOutline',
      settings.autoScrollOutline,
    )
    this.addCheckbox(
      'Remember collapse state during the session',
      'Restore branch choices when switching between open files.',
      'rememberCollapseState',
      settings.rememberCollapseState,
    )

    this.addSettingTitle('Structure')
    this.addSelect(
      'Minimum heading level',
      'Hide headings shallower than this level.',
      'minHeadingLevel',
      settings.minHeadingLevel,
      HEADING_LEVEL_OPTIONS.map((level) => [String(level), `H${level}`]),
      true,
    )
    this.addSelect(
      'Maximum heading level',
      'Hide headings deeper than this level.',
      'maxHeadingLevel',
      settings.maxHeadingLevel,
      HEADING_LEVEL_OPTIONS.map((level) => [String(level), `H${level}`]),
      true,
    )
    this.addSelect(
      'Expand by default through',
      'Show this level initially; branches at this level start collapsed.',
      'expandThroughLevel',
      settings.expandThroughLevel,
      HEADING_LEVEL_OPTIONS.map((level) => [String(level), `H${level}`]),
      true,
    )

    this.addSettingTitle('Appearance')
    this.addCheckbox(
      'Wrap long heading labels',
      'Show long headings on multiple lines instead of truncating them.',
      'wrapHeadingLabels',
      settings.wrapHeadingLabels,
    )
    this.addSelect(
      'Density',
      'Choose the vertical spacing between outline rows.',
      'density',
      settings.density,
      DENSITY_OPTIONS.map((value) => [value, DENSITY_LABELS[value]]),
    )
    this.addSelect(
      'Indentation',
      'Choose the horizontal spacing between nested levels.',
      'indentation',
      settings.indentation,
      INDENTATION_OPTIONS.map((value) => [value, INDENTATION_LABELS[value]]),
    )
  }

  private currentSettings() {
    const raw = {} as Partial<OutlineSettings>
    for (const key of Object.keys(
      normalizeOutlineSettings(),
    ) as SettingKey[]) {
      raw[key] = this.outlinePlugin.settings.get(key)
    }
    return normalizeOutlineSettings(raw)
  }

  private persist(patch: Partial<OutlineSettings>, rebuild = false) {
    const normalized = normalizeOutlineSettings({
      ...this.currentSettings(),
      ...patch,
    })

    for (const key of Object.keys(normalized) as SettingKey[]) {
      this.outlinePlugin.settings.set(key, normalized[key])
    }

    if (rebuild) this.onshow()
  }

  private addCheckbox(
    name: string,
    description: string,
    key: SettingKey,
    checked: boolean,
  ) {
    this.addSetting((setting: SettingItem) => {
      setting.addName(name)
      setting.addDescription(description)
      setting.addCheckbox((checkbox) => {
        checkbox.checked = checked
        checkbox.addEventListener('change', () => {
          this.persist({ [key]: checkbox.checked })
        })
      })
    })
  }

  private addSelect(
    name: string,
    description: string,
    key: SettingKey,
    selected: string | number,
    options: Array<readonly [string, string]>,
    numeric = false,
  ) {
    this.addSetting((setting: SettingItem) => {
      setting.addName(name)
      setting.addDescription(description)
      setting.addSelect((select) => {
        for (const [value, label] of options) {
          const option = document.createElement('option')
          option.value = value
          option.textContent = label
          select.append(option)
        }
        select.value = String(selected)
        select.addEventListener('change', () => {
          this.persist(
            { [key]: numeric ? Number(select.value) : select.value },
            key === 'minHeadingLevel' || key === 'maxHeadingLevel',
          )
        })
      })
    })
  }
}
