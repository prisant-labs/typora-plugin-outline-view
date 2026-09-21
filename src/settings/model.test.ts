import { describe, expect, it } from 'vitest'

import {
  COLLAPSE_ICON_OPTIONS,
  COLOR_SOURCE_OPTIONS,
  DEFAULT_OUTLINE_SETTINGS,
  DENSITY_OPTIONS,
  GUIDE_STRENGTH_OPTIONS,
  HEADING_LEVEL_OPTIONS,
  INDENTATION_OPTIONS,
  SECTION_SEPARATION_OPTIONS,
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
      collapseIcon: 'triangle',
      showVerticalGuides: false,
      verticalGuideStrength: 'quiet',
      zebraRows: false,
      sectionSeparation: 'none',
      emphasizeActivePath: false,
      showCurrentPathBar: false,
      focusCurrentBranch: false,
    })
    expect(normalizeOutlineSettings().verticalGuideColor).toEqual({
      source: 'theme', light: '#cbd0d4', dark: '#505861', sameInBothThemes: false, opacity: 100,
    })
    expect(normalizeOutlineSettings().zebraRowAColor).toEqual({
      source: 'theme', light: '#ffffff', dark: '#24272c', sameInBothThemes: false, opacity: 100,
    })
    expect(normalizeOutlineSettings().zebraRowBColor).toEqual({
      source: 'theme', light: '#f5f6f7', dark: '#2c3036', sameInBothThemes: false, opacity: 100,
    })
    expect(DEFAULT_OUTLINE_SETTINGS).toEqual(normalizeOutlineSettings())
  })

  it('preserves approved outline appearance and browsing choices', () => {
    expect(normalizeOutlineSettings({
      collapseIcon: 'folder',
      showVerticalGuides: true,
      verticalGuideStrength: 'clear',
      verticalGuideColor: { source: 'custom', light: '#AABBCC', dark: '#112233', sameInBothThemes: true, opacity: 63 },
      zebraRows: true,
      zebraRowAColor: { source: 'default', light: '#abcdef', dark: '#123456', sameInBothThemes: false, opacity: 75 },
      zebraRowBColor: { source: 'custom', light: '#FFEEDD', dark: '#334455', sameInBothThemes: false, opacity: 41 },
      sectionSeparation: 'divider',
      emphasizeActivePath: true,
      showCurrentPathBar: true,
      focusCurrentBranch: true,
    })).toMatchObject({
      collapseIcon: 'folder',
      showVerticalGuides: true,
      verticalGuideStrength: 'clear',
      verticalGuideColor: { source: 'custom', light: '#aabbcc', dark: '#112233', sameInBothThemes: true, opacity: 63 },
      zebraRows: true,
      zebraRowAColor: { source: 'default', light: '#abcdef', dark: '#123456', sameInBothThemes: false, opacity: 75 },
      zebraRowBColor: { source: 'custom', light: '#ffeedd', dark: '#334455', sameInBothThemes: false, opacity: 41 },
      sectionSeparation: 'divider',
      emphasizeActivePath: true,
      showCurrentPathBar: true,
      focusCurrentBranch: true,
    })
  })

  it('normalizes unsafe outline appearance values and creates independent color records', () => {
    const settings = normalizeOutlineSettings({
      collapseIcon: 'emoji',
      showVerticalGuides: 'yes',
      verticalGuideStrength: 'heavy',
      verticalGuideColor: { source: 'custom', light: 'red', dark: '#ABCDEF', sameInBothThemes: 'yes', opacity: 130 },
      zebraRows: 1,
      zebraRowAColor: { source: 'unknown', light: '#123456', dark: '#654321', sameInBothThemes: true, opacity: -5 },
      zebraRowBColor: null,
      sectionSeparation: 'rule',
      emphasizeActivePath: 'true',
      showCurrentPathBar: {},
      focusCurrentBranch: null,
    })
    expect(settings).toMatchObject({
      collapseIcon: 'triangle', showVerticalGuides: false, verticalGuideStrength: 'quiet', zebraRows: false,
      sectionSeparation: 'none', emphasizeActivePath: false, showCurrentPathBar: false, focusCurrentBranch: false,
    })
    expect(settings.verticalGuideColor).toEqual({ source: 'custom', light: '#cbd0d4', dark: '#abcdef', sameInBothThemes: false, opacity: 100 })
    expect(settings.zebraRowAColor).toEqual({ source: 'theme', light: '#123456', dark: '#654321', sameInBothThemes: true, opacity: 0 })
    expect(settings.zebraRowBColor).toEqual(DEFAULT_OUTLINE_SETTINGS.zebraRowBColor)
    settings.verticalGuideColor.light = '#000000'
    expect(normalizeOutlineSettings().verticalGuideColor.light).toBe('#cbd0d4')
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
    expect(COLLAPSE_ICON_OPTIONS).toEqual(['triangle', 'bullet', 'arrow', 'folder', 'none'])
    expect(GUIDE_STRENGTH_OPTIONS).toEqual(['quiet', 'clear'])
    expect(SECTION_SEPARATION_OPTIONS).toEqual(['none', 'space', 'divider'])
    expect(COLOR_SOURCE_OPTIONS).toEqual(['theme', 'default', 'custom'])
  })

  it('adds appearance defaults without changing legacy range settings', () => {
    const settings = normalizeOutlineSettings({ minHeadingLevel: 2, maxHeadingLevel: 4 })
    expect(settings).toMatchObject({ showLevelSelector: true, selectorStyle: 'rail', selectorLabels: true, selectorColor: 'theme', minHeadingLevel: 2, maxHeadingLevel: 4 })
    expect(settings.headingStyles[1]).toEqual({ size: 100, bold: false, italic: false, underline: false, casing: 'normal', color: null })
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
    expect(settings.headingStyles[1]).toEqual({ size: 250, bold: true, italic: false, underline: false, casing: 'small-caps', color: '#aabbcc' })
    expect(settings.headingStyles[2]).toMatchObject({ size: 50, bold: false, casing: 'normal', color: null })
    expect(settings.headingStyles[3].size).toBe(115)
    expect(settings.headingStyles[4].size).toBe(100)
    expect(settings.headingStyles[5].size).toBe(100)
    expect(settings.selectorStyle).toBe('rail')
    expect(settings.selectorColor).toBe('theme')
  })

  it('migrates legacy theme emphasis to unselected while preserving explicit choices and color', () => {
    const styles = normalizeOutlineSettings({ headingStyles: {
      1: { bold: null, italic: true, underline: false, color: '#123456' },
      2: { bold: true, italic: null, underline: null },
    } }).headingStyles
    expect(styles[1]).toMatchObject({ bold: false, italic: true, underline: false, color: '#123456' })
    expect(styles[2]).toMatchObject({ bold: true, italic: false, underline: false, color: null })
  })
})
