import { describe, expect, it } from 'vitest'

import { normalizeOutlineSettings, type OutlineSettings } from './model'
import {
  MAX_SETTINGS_FILE_LENGTH, SETTINGS_FILE_SCHEMA, parseOutlineSettingsFile, serializeOutlineSettings,
} from './transfer'

const PLUGIN_ID = 'prisant-labs.outline-view'
const plugin = { id: PLUGIN_ID, version: '0.4.1' }

function customized(): OutlineSettings {
  const settings = normalizeOutlineSettings()
  return normalizeOutlineSettings({
    ...settings,
    density: 'compact',
    minHeadingLevel: 2,
    maxHeadingLevel: 4,
    zebraRows: true,
    verticalGuideColor: { source: 'custom', light: '#112233', dark: '#445566', sameInBothThemes: true, opacity: 40 },
    headingStyles: {
      ...settings.headingStyles,
      2: { size: 125, bold: true, italic: true, underline: false, casing: 'small-caps', color: '#abcdef' },
    },
  })
}

function file(fields: Record<string, unknown>) {
  return JSON.stringify({ plugin: PLUGIN_ID, schema: 1, ...fields })
}

describe('serializeOutlineSettings', () => {
  it('wraps the settings in a versioned file that names the plugin', () => {
    const now = new Date('2026-11-04T12:00:00.000Z')
    const parsed = JSON.parse(serializeOutlineSettings(customized(), plugin, now))
    expect(parsed).toEqual({
      plugin: PLUGIN_ID,
      schema: SETTINGS_FILE_SCHEMA,
      pluginVersion: '0.4.1',
      exportedAt: '2026-11-04T12:00:00.000Z',
      settings: customized(),
    })
  })
})

describe('parseOutlineSettingsFile', () => {
  it('round-trips every setting, including Light and Dark colors and opacity, with nothing to report', () => {
    const result = parseOutlineSettingsFile(serializeOutlineSettings(customized(), plugin), PLUGIN_ID)
    expect(result).toEqual({ ok: true, settings: customized(), adjusted: [], missing: [], ignored: [] })
  })

  it('accepts a file saved with a byte order mark', () => {
    const result = parseOutlineSettingsFile('﻿' + serializeOutlineSettings(customized(), plugin), PLUGIN_ID)
    expect(result.ok).toBe(true)
  })

  it('does not call two objects different because their keys are in another order', () => {
    const color = { opacity: 100, sameInBothThemes: false, dark: '#505861', light: '#cbd0d4', source: 'theme' }
    const result = parseOutlineSettingsFile(file({ settings: { verticalGuideColor: color } }), PLUGIN_ID)
    expect(result.ok && result.adjusted).toEqual([])
  })

  it.each([
    ['text that is not JSON', 'not json', 'not valid JSON'],
    ['an array', '[]', 'not an Outline View settings file'],
    ['null', 'null', 'not an Outline View settings file'],
    ['a bare settings object', '{"density":"compact"}', 'not an Outline View settings file'],
    ['another plugin\'s file', '{"plugin":"someone.else","schema":1,"settings":{}}', 'another plugin'],
    ['a missing schema', `{"plugin":"${PLUGIN_ID}","settings":{}}`, 'schema'],
    ['a fractional schema', file({ schema: 1.5, settings: {} }), 'schema'],
    ['a schema below one', file({ schema: 0, settings: {} }), 'schema'],
    ['a newer schema', file({ schema: SETTINGS_FILE_SCHEMA + 1, settings: {} }), 'newer Outline View'],
    ['settings that are not an object', file({ settings: 'compact' }), 'no settings'],
    ['settings that are an array', file({ settings: [] }), 'no settings'],
  ])('rejects %s', (_name, text, message) => {
    const result = parseOutlineSettingsFile(text, PLUGIN_ID)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.message).toContain(message)
  })

  it('rejects text past the size limit before parsing it', () => {
    const result = parseOutlineSettingsFile(' '.repeat(MAX_SETTINGS_FILE_LENGTH + 1), PLUGIN_ID)
    expect(!result.ok && result.message).toContain('too large')
  })

  it('names values it adjusted, settings the file omits, and keys it does not know', () => {
    const result = parseOutlineSettingsFile(file({
      settings: { ...normalizeOutlineSettings(), density: 'huge', futureOption: true, autoOpen: undefined },
    }), PLUGIN_ID)
    expect(result.ok && result.settings.density).toBe('comfortable')
    expect(result.ok && result.adjusted).toEqual(['density'])
    expect(result.ok && result.missing).toEqual(['autoOpen'])
    expect(result.ok && result.ignored).toEqual(['futureOption'])
  })

  it('reports a maximum heading level below the minimum as adjusted', () => {
    const result = parseOutlineSettingsFile(file({ settings: { minHeadingLevel: 5, maxHeadingLevel: 2 } }), PLUGIN_ID)
    expect(result.ok && result.settings.maxHeadingLevel).toBe(5)
    expect(result.ok && result.adjusted).toEqual(['maxHeadingLevel'])
  })

  it('never applies keys that only JSON can smuggle in', () => {
    const result = parseOutlineSettingsFile(file({ settings: JSON.parse('{"__proto__":{"density":"compact"}}') }), PLUGIN_ID)
    expect(result.ok && result.settings.density).toBe('comfortable')
    expect(result.ok && result.ignored).toEqual(['__proto__'])
    expect(({} as Record<string, unknown>).density).toBeUndefined()
  })
})
