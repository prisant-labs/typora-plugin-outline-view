import type { HeadingLevel } from '../outline/model'

export const HEADING_LEVEL_OPTIONS = [1, 2, 3, 4, 5, 6] as const
export const DENSITY_OPTIONS = ['compact', 'comfortable'] as const
export const INDENTATION_OPTIONS = ['small', 'medium', 'large'] as const
export const SELECTOR_STYLES = ['rail', 'enclosure', 'bracket'] as const
export const CASING_OPTIONS = ['normal', 'uppercase', 'small-caps'] as const
export const COLLAPSE_ICON_OPTIONS = ['triangle', 'bullet', 'arrow', 'folder', 'none'] as const
export const GUIDE_STRENGTH_OPTIONS = ['quiet', 'clear'] as const
export const SECTION_SEPARATION_OPTIONS = ['none', 'space', 'divider'] as const
export const COLOR_SOURCE_OPTIONS = ['theme', 'default', 'custom'] as const

export interface AppearanceColor {
  source: (typeof COLOR_SOURCE_OPTIONS)[number]
  light: string
  dark: string
  sameInBothThemes: boolean
  opacity: number
}

const GUIDE_COLOR_DEFAULTS: Readonly<AppearanceColor> = {
  source: 'theme', light: '#cbd0d4', dark: '#505861', sameInBothThemes: false, opacity: 100,
}
const ZEBRA_A_COLOR_DEFAULTS: Readonly<AppearanceColor> = {
  source: 'theme', light: '#ffffff', dark: '#24272c', sameInBothThemes: false, opacity: 100,
}
const ZEBRA_B_COLOR_DEFAULTS: Readonly<AppearanceColor> = {
  source: 'theme', light: '#f5f6f7', dark: '#2c3036', sameInBothThemes: false, opacity: 100,
}

export interface HeadingAppearance {
  size: number
  bold: boolean
  italic: boolean
  underline: boolean
  casing: (typeof CASING_OPTIONS)[number]
  color: string | null
}

export type HeadingStyles = Record<HeadingLevel, HeadingAppearance>

export function defaultHeadingAppearance(): HeadingAppearance {
  return { size: 100, bold: false, italic: false, underline: false, casing: 'normal', color: null }
}

function normalizeHeadingStyles(value: unknown): HeadingStyles {
  const records = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return Object.fromEntries(HEADING_LEVEL_OPTIONS.map(level => {
    const candidate = records[level]
    const raw = candidate && typeof candidate === 'object' ? candidate as Record<string, unknown> : {}
    return [level, {
      size: typeof raw.size === 'number' && Number.isFinite(raw.size)
        ? Math.max(50, Math.min(250, Math.round(raw.size / 5) * 5)) : 100,
      // Legacy null (Theme) becomes unselected; explicit on/off is preserved.
      bold: raw.bold === true,
      italic: raw.italic === true,
      underline: raw.underline === true,
      casing: isOption(raw.casing, CASING_OPTIONS) ? raw.casing : 'normal',
      color: typeof raw.color === 'string' && /^#[0-9a-f]{6}$/i.test(raw.color)
        ? raw.color.toLowerCase() : null,
    }]
  })) as HeadingStyles
}

export type OutlineDensity = (typeof DENSITY_OPTIONS)[number]
export type OutlineIndentation = (typeof INDENTATION_OPTIONS)[number]
export type CollapseIcon = (typeof COLLAPSE_ICON_OPTIONS)[number]
export type GuideStrength = (typeof GUIDE_STRENGTH_OPTIONS)[number]
export type SectionSeparation = (typeof SECTION_SEPARATION_OPTIONS)[number]

function normalizeHexColor(value: unknown, fallback: string) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toLowerCase()
    : fallback
}

function normalizeAppearanceColor(value: unknown, fallback: Readonly<AppearanceColor>): AppearanceColor {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const opacity = typeof raw.opacity === 'number' && Number.isFinite(raw.opacity)
    ? Math.max(0, Math.min(100, Math.round(raw.opacity)))
    : fallback.opacity
  return {
    source: isOption(raw.source, COLOR_SOURCE_OPTIONS) ? raw.source : fallback.source,
    light: normalizeHexColor(raw.light, fallback.light),
    dark: normalizeHexColor(raw.dark, fallback.dark),
    sameInBothThemes: booleanOrDefault(raw.sameInBothThemes, fallback.sameInBothThemes),
    opacity,
  }
}

export interface OutlineSettings {
  autoOpen: boolean
  followActiveHeading: boolean
  autoScrollOutline: boolean
  rememberCollapseState: boolean
  wrapHeadingLabels: boolean
  minHeadingLevel: HeadingLevel
  maxHeadingLevel: HeadingLevel
  expandThroughLevel: HeadingLevel
  density: OutlineDensity
  indentation: OutlineIndentation
  showLevelSelector: boolean
  selectorStyle: (typeof SELECTOR_STYLES)[number]
  selectorLabels: boolean
  selectorColor: 'theme' | 'grayscale'
  headingStyles: HeadingStyles
  collapseIcon: CollapseIcon
  showVerticalGuides: boolean
  verticalGuideStrength: GuideStrength
  verticalGuideColor: AppearanceColor
  zebraRows: boolean
  zebraRowAColor: AppearanceColor
  zebraRowBColor: AppearanceColor
  sectionSeparation: SectionSeparation
  emphasizeActivePath: boolean
  showCurrentPathBar: boolean
  focusCurrentBranch: boolean
}

export const DEFAULT_OUTLINE_SETTINGS: Readonly<OutlineSettings> = {
  autoOpen: false,
  followActiveHeading: true,
  autoScrollOutline: true,
  rememberCollapseState: true,
  wrapHeadingLabels: true,
  minHeadingLevel: 1,
  maxHeadingLevel: 6,
  expandThroughLevel: 3,
  density: 'comfortable',
  indentation: 'medium',
  showLevelSelector: true,
  selectorStyle: 'rail',
  selectorLabels: true,
  selectorColor: 'theme',
  headingStyles: normalizeHeadingStyles(undefined),
  collapseIcon: 'triangle',
  showVerticalGuides: false,
  verticalGuideStrength: 'quiet',
  verticalGuideColor: { ...GUIDE_COLOR_DEFAULTS },
  zebraRows: false,
  zebraRowAColor: { ...ZEBRA_A_COLOR_DEFAULTS },
  zebraRowBColor: { ...ZEBRA_B_COLOR_DEFAULTS },
  sectionSeparation: 'none',
  emphasizeActivePath: false,
  showCurrentPathBar: false,
  focusCurrentBranch: false,
}

function isOption<T>(value: unknown, options: readonly T[]): value is T {
  return options.includes(value as T)
}

function booleanOrDefault(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

export function normalizeOutlineSettings(
  value: Partial<Record<keyof OutlineSettings, unknown>> = {},
): OutlineSettings {
  const minHeadingLevel = isOption(
    value.minHeadingLevel,
    HEADING_LEVEL_OPTIONS,
  )
    ? value.minHeadingLevel
    : DEFAULT_OUTLINE_SETTINGS.minHeadingLevel
  const persistedMaximum = isOption(
    value.maxHeadingLevel,
    HEADING_LEVEL_OPTIONS,
  )
    ? value.maxHeadingLevel
    : DEFAULT_OUTLINE_SETTINGS.maxHeadingLevel
  const maxHeadingLevel = Math.max(
    minHeadingLevel,
    persistedMaximum,
  ) as HeadingLevel

  return {
    showLevelSelector: booleanOrDefault(value.showLevelSelector, true),
    selectorStyle: isOption(value.selectorStyle, SELECTOR_STYLES) ? value.selectorStyle : 'rail',
    selectorLabels: booleanOrDefault(value.selectorLabels, true),
    selectorColor: value.selectorColor === 'grayscale' ? 'grayscale' : 'theme',
    headingStyles: normalizeHeadingStyles(value.headingStyles),
    collapseIcon: isOption(value.collapseIcon, COLLAPSE_ICON_OPTIONS) ? value.collapseIcon : 'triangle',
    showVerticalGuides: booleanOrDefault(value.showVerticalGuides, false),
    verticalGuideStrength: isOption(value.verticalGuideStrength, GUIDE_STRENGTH_OPTIONS) ? value.verticalGuideStrength : 'quiet',
    verticalGuideColor: normalizeAppearanceColor(value.verticalGuideColor, GUIDE_COLOR_DEFAULTS),
    zebraRows: booleanOrDefault(value.zebraRows, false),
    zebraRowAColor: normalizeAppearanceColor(value.zebraRowAColor, ZEBRA_A_COLOR_DEFAULTS),
    zebraRowBColor: normalizeAppearanceColor(value.zebraRowBColor, ZEBRA_B_COLOR_DEFAULTS),
    sectionSeparation: isOption(value.sectionSeparation, SECTION_SEPARATION_OPTIONS) ? value.sectionSeparation : 'none',
    emphasizeActivePath: booleanOrDefault(value.emphasizeActivePath, false),
    showCurrentPathBar: booleanOrDefault(value.showCurrentPathBar, false),
    focusCurrentBranch: booleanOrDefault(value.focusCurrentBranch, false),
    autoOpen: booleanOrDefault(
      value.autoOpen,
      DEFAULT_OUTLINE_SETTINGS.autoOpen,
    ),
    followActiveHeading: booleanOrDefault(
      value.followActiveHeading,
      DEFAULT_OUTLINE_SETTINGS.followActiveHeading,
    ),
    autoScrollOutline: booleanOrDefault(
      value.autoScrollOutline,
      DEFAULT_OUTLINE_SETTINGS.autoScrollOutline,
    ),
    rememberCollapseState: booleanOrDefault(
      value.rememberCollapseState,
      DEFAULT_OUTLINE_SETTINGS.rememberCollapseState,
    ),
    wrapHeadingLabels: booleanOrDefault(
      value.wrapHeadingLabels,
      DEFAULT_OUTLINE_SETTINGS.wrapHeadingLabels,
    ),
    minHeadingLevel,
    maxHeadingLevel,
    expandThroughLevel: isOption(
      value.expandThroughLevel,
      HEADING_LEVEL_OPTIONS,
    )
      ? value.expandThroughLevel
      : DEFAULT_OUTLINE_SETTINGS.expandThroughLevel,
    density: isOption(value.density, DENSITY_OPTIONS)
      ? value.density
      : DEFAULT_OUTLINE_SETTINGS.density,
    indentation: isOption(value.indentation, INDENTATION_OPTIONS)
      ? value.indentation
      : DEFAULT_OUTLINE_SETTINGS.indentation,
  }
}

export function readOutlineSettings(store?: { get(key: keyof OutlineSettings): unknown }): OutlineSettings {
  if (!store) return normalizeOutlineSettings()
  return normalizeOutlineSettings(Object.fromEntries(
    Object.keys(DEFAULT_OUTLINE_SETTINGS).map(key => [key, store.get(key as keyof OutlineSettings)]),
  ))
}
