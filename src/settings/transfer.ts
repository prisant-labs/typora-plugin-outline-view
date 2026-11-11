import { DEFAULT_OUTLINE_SETTINGS, normalizeOutlineSettings, type OutlineSettings } from './model'

/** D026: raise this only when an older Outline View could not read the new file correctly. */
export const SETTINGS_FILE_SCHEMA = 1
export const SETTINGS_FILE_NAME = 'outline-view-settings.json'
/** The settings fit in a few kilobytes, so anything this large is the wrong file. */
export const MAX_SETTINGS_FILE_LENGTH = 1_000_000

export type SettingsImport =
  | {
    ok: true
    settings: OutlineSettings
    /** Keys in the file whose value normalization changed. */
    adjusted: string[]
    /** Keys the file omits, which take their default. */
    missing: string[]
    /** Keys this version does not know, which are not applied. */
    ignored: string[]
  }
  | { ok: false; message: string }

export function serializeOutlineSettings(
  settings: OutlineSettings,
  plugin: { id: string; version?: string },
  now = new Date(),
) {
  return JSON.stringify({
    plugin: plugin.id,
    schema: SETTINGS_FILE_SCHEMA,
    pluginVersion: plugin.version,
    exportedAt: now.toISOString(),
    settings,
  }, null, 2) + '\n'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function sameValue(left: unknown, right: unknown): boolean {
  if (!isRecord(left) || !isRecord(right)) return left === right
  const keys = Object.keys(left)
  return keys.length === Object.keys(right).length
    && keys.every(key => sameValue(left[key], right[key]))
}

/** Every failure returns a message and no settings, so a bad file can never change anything. */
export function parseOutlineSettingsFile(text: string, pluginId: string): SettingsImport {
  if (text.length > MAX_SETTINGS_FILE_LENGTH) {
    return { ok: false, message: 'This is too large to be an Outline View settings file.' }
  }
  let file: unknown
  try {
    // Notepad can save a byte order mark, which JSON.parse rejects.
    file = JSON.parse(text.replace(/^﻿/, ''))
  } catch {
    return { ok: false, message: 'This is not valid JSON.' }
  }
  if (!isRecord(file) || !('plugin' in file) || !('settings' in file)) {
    return { ok: false, message: 'This is not an Outline View settings file.' }
  }
  if (file.plugin !== pluginId) {
    return { ok: false, message: 'This settings file belongs to another plugin.' }
  }
  if (!Number.isInteger(file.schema) || (file.schema as number) < 1) {
    return { ok: false, message: 'This settings file has no usable schema number.' }
  }
  if ((file.schema as number) > SETTINGS_FILE_SCHEMA) {
    return { ok: false, message: 'A newer Outline View made this settings file. Update Outline View, then import it again.' }
  }
  const raw = file.settings
  if (!isRecord(raw)) {
    return { ok: false, message: 'This settings file has no settings in it.' }
  }

  const settings = normalizeOutlineSettings(raw)
  const known = Object.keys(DEFAULT_OUTLINE_SETTINGS) as Array<keyof OutlineSettings>
  return {
    ok: true,
    settings,
    adjusted: known.filter(key => key in raw && !sameValue(raw[key], settings[key])),
    missing: known.filter(key => !(key in raw)),
    ignored: Object.keys(raw).filter(key => !known.includes(key as keyof OutlineSettings)),
  }
}
