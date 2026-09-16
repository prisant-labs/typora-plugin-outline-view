import { describe, expect, it } from 'vitest'

import {
  DEFAULT_OUTLINE_SETTINGS,
  DENSITY_OPTIONS,
  HEADING_LEVEL_OPTIONS,
  INDENTATION_OPTIONS,
  normalizeOutlineSettings,
} from './model'

describe('normalizeOutlineSettings', () => {
  it('preserves the established outline defaults', () => {
    expect(normalizeOutlineSettings()).toMatchObject({
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
    })
    expect(DEFAULT_OUTLINE_SETTINGS).toEqual(normalizeOutlineSettings())
  })

  it('preserves valid persisted settings', () => {
    expect(
      normalizeOutlineSettings({
        autoOpen: true,
        followActiveHeading: false,
        autoScrollOutline: false,
        rememberCollapseState: false,
        wrapHeadingLabels: false,
        minHeadingLevel: 2,
        maxHeadingLevel: 5,
        expandThroughLevel: 4,
        density: 'compact',
        indentation: 'large',
      }),
    ).toMatchObject({
      autoOpen: true,
      followActiveHeading: false,
      autoScrollOutline: false,
      rememberCollapseState: false,
      wrapHeadingLabels: false,
      minHeadingLevel: 2,
      maxHeadingLevel: 5,
      expandThroughLevel: 4,
      density: 'compact',
      indentation: 'large',
    })
  })

  it('replaces invalid values with safe defaults', () => {
    expect(
      normalizeOutlineSettings({
        autoOpen: 'yes',
        followActiveHeading: null,
        autoScrollOutline: 1,
        rememberCollapseState: {},
        wrapHeadingLabels: 'sometimes',
        minHeadingLevel: 0,
        maxHeadingLevel: 10,
        expandThroughLevel: 2.5,
        density: 'spacious',
        indentation: 'enormous',
      }),
    ).toEqual(DEFAULT_OUTLINE_SETTINGS)
  })

  it('clamps an inverted heading range by raising the maximum', () => {
    expect(
      normalizeOutlineSettings({ minHeadingLevel: 5, maxHeadingLevel: 2 }),
    ).toMatchObject({ minHeadingLevel: 5, maxHeadingLevel: 5 })
  })

  it('exports the complete option sets used by the settings UI', () => {
    expect(HEADING_LEVEL_OPTIONS).toEqual([1, 2, 3, 4, 5, 6])
    expect(DENSITY_OPTIONS).toEqual(['compact', 'comfortable'])
    expect(INDENTATION_OPTIONS).toEqual(['small', 'medium', 'large'])
  })

  it('adds appearance defaults without changing legacy range settings', () => {
    const settings = normalizeOutlineSettings({ minHeadingLevel: 2, maxHeadingLevel: 4 })
    expect(settings).toMatchObject({ showLevelSelector: true, selectorStyle: 'rail', selectorLabels: true, selectorColor: 'theme', minHeadingLevel: 2, maxHeadingLevel: 4 })
    expect(settings.headingStyles[1]).toEqual({ size: 100, bold: null, italic: null, underline: null, casing: 'normal', color: null })
    expect(settings.headingStyles[6]).toEqual(settings.headingStyles[1])
    settings.headingStyles[1].size = 200
    expect(normalizeOutlineSettings().headingStyles[1].size).toBe(100)
    expect(settings.headingStyles[2].size).toBe(100)
  })

  it('normalizes untrusted per-heading styles and bounds sizes', () => {
    const settings = normalizeOutlineSettings({ headingStyles: {
      1: { size: 999, bold: true, italic: false, underline: null, casing: 'small-caps', color: '#AAbBcc' },
      2: { size: 12, bold: 'yes', casing: 'invalid', color: 'url(https://example.com)' },
      3: { size: 113 }, 4: { size: Infinity }, 5: null,
    }, selectorStyle: 'invalid', selectorColor: 'invalid' })
    expect(settings.headingStyles[1]).toEqual({ size: 250, bold: true, italic: false, underline: null, casing: 'small-caps', color: '#aabbcc' })
    expect(settings.headingStyles[2]).toMatchObject({ size: 50, bold: null, casing: 'normal', color: null })
    expect(settings.headingStyles[3].size).toBe(115)
    expect(settings.headingStyles[4].size).toBe(100)
    expect(settings.headingStyles[5].size).toBe(100)
    expect(settings.selectorStyle).toBe('rail')
    expect(settings.selectorColor).toBe('theme')
  })
})
