import type { HeadingLevel } from '../outline/model'

export const HEADING_LEVEL_OPTIONS = [1, 2, 3, 4, 5, 6] as const
export const DENSITY_OPTIONS = ['compact', 'comfortable'] as const
export const INDENTATION_OPTIONS = ['small', 'medium', 'large'] as const
export const SELECTOR_STYLES = ['rail', 'enclosure', 'bracket'] as const
export const CASING_OPTIONS = ['normal', 'uppercase', 'small-caps'] as const

export interface HeadingAppearance {
  size: number
  bold: boolean | null
  italic: boolean | null
  underline: boolean | null
  casing: (typeof CASING_OPTIONS)[number]
  color: string | null
}

export type HeadingStyles = Record<HeadingLevel, HeadingAppearance>

export function defaultHeadingAppearance(): HeadingAppearance {
  return { size: 100, bold: null, italic: null, underline: null, casing: 'normal', color: null }
}

function normalizeHeadingStyles(value: unknown): HeadingStyles {
  const records = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return Object.fromEntries(HEADING_LEVEL_OPTIONS.map(level => {
    const candidate = records[level]
    const raw = candidate && typeof candidate === 'object' ? candidate as Record<string, unknown> : {}
    return [level, {
      size: typeof raw.size === 'number' && Number.isFinite(raw.size)
        ? Math.max(50, Math.min(250, Math.round(raw.size / 5) * 5)) : 100,
      bold: typeof raw.bold === 'boolean' ? raw.bold : null,
      italic: typeof raw.italic === 'boolean' ? raw.italic : null,
      underline: typeof raw.underline === 'boolean' ? raw.underline : null,
      casing: isOption(raw.casing, CASING_OPTIONS) ? raw.casing : 'normal',
      color: typeof raw.color === 'string' && /^#[0-9a-f]{6}$/i.test(raw.color)
        ? raw.color.toLowerCase() : null,
    }]
  })) as HeadingStyles
}

export type OutlineDensity = (typeof DENSITY_OPTIONS)[number]
export type OutlineIndentation = (typeof INDENTATION_OPTIONS)[number]

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
