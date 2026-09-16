import type { HeadingLevel } from '../outline/model'

export const HEADING_LEVEL_OPTIONS = [1, 2, 3, 4, 5, 6] as const
export const DENSITY_OPTIONS = ['compact', 'comfortable'] as const
export const INDENTATION_OPTIONS = ['small', 'medium', 'large'] as const

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
