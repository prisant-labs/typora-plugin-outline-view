import { describe, expect, it } from 'vitest'

import {
  DEFAULT_OUTLINE_SETTINGS,
  DENSITY_OPTIONS,
  HEADING_LEVEL_OPTIONS,
  INDENTATION_OPTIONS,
  normalizeOutlineSettings,
} from './model'

describe('normalizeOutlineSettings', () => {
  it('returns the approved 0.1.0 defaults', () => {
    expect(normalizeOutlineSettings()).toEqual({
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
    ).toEqual({
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
})
