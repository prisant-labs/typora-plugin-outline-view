// @vitest-environment node

import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

async function stylesheet() {
  return readFile(new URL('./style.scss', import.meta.url), 'utf8')
}

function rule(source: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const normalizedSource = source.replace(/\r\n/g, '\n')
  return normalizedSource.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 's'))?.[1] ?? ''
}

describe('outline layout safeguards', () => {
  it('keeps emphasis glyphs centered without an automatic-state corner badge', async () => {
    const source = await readFile(new URL('./settings.scss', import.meta.url), 'utf8')
    expect(source).not.toContain("content: 'A'")
    expect(source).not.toContain("aria-pressed='mixed'")
  })

  it('fills the wide preview card while leaving a compact narrow preview', async () => {
    const source = await readFile(new URL('./settings.scss', import.meta.url), 'utf8')
    const preview = rule(source, '.outline-view-settings__preview')
    const panel = rule(source, '.outline-view.outline-view--preview')
    expect(preview).toContain('display: flex')
    expect(preview).toContain('flex-direction: column')
    expect(preview).toContain('height: var(--outline-preview-height')
    expect(preview).toContain('max-width: 390px')
    expect(preview).toContain('flex: 0 0 390px')
    expect(rule(source, '.outline-view-settings__preview-meta')).toContain('display: flex')
    expect(rule(source, '.outline-view-settings__layout')).toContain('max-width: 1170px')
    expect(panel).toContain('flex: 1 1 0')
    expect(panel).toContain('min-height: 0')
    expect(source).not.toContain('height: clamp(170px, 35vh, 340px)')
    const narrow = source.slice(source.indexOf('@container'))
    expect(rule(narrow, '.outline-view-settings__preview')).toContain('height: auto')
    expect(rule(narrow, '.outline-view.outline-view--preview')).toContain('flex: none')
  })

  it('does not draw a short armed-endpoint dash in any selector style', async () => {
    const source = await readFile(new URL('./selector.scss', import.meta.url), 'utf8')
    expect(source).not.toContain('.outline-view__range-handle.is-armed::after')
    expect(rule(source, '.outline-view__range-handle:focus-visible')).toContain('outline:')
    expect(source).toContain('.outline-view__range-active')
    expect(source).toContain("[data-style='bracket']")
  })

  it('keeps setting selects close and contains preview using host-safe border colors', async () => {
    const source = await readFile(new URL('./settings.scss', import.meta.url), 'utf8')
    expect(source).toContain('flex: 0 1 20rem')
    expect(source).toContain('--typ-border-color')
    expect(source).not.toContain('--base-border')
    expect(rule(source, '.outline-view-settings__preview')).toContain('border: 1px solid var(--settings-border)')
    expect(rule(source, '.outline-view-settings__nav')).toContain('position: sticky')
    expect(source).not.toContain('border-style: dashed')
    expect(rule(source, ".outline-view-settings__heading-style button[aria-pressed='true']")).toContain('color: var(--settings-on-text)')
    expect(rule(source, ".outline-view-settings__heading-style button[aria-pressed='true']")).toContain('background: var(--settings-on-bg)')
  })
  it('keeps the outline viewport vertical-only and constrains nested lists', async () => {
    const source = (await stylesheet()).replace(/\r?\n/g, '\r\n')
    const content = rule(source, '.outline-view__content')
    const lists = rule(source, '.outline-view__tree,\n.outline-view__group')

    expect(content).toContain('overflow-x: hidden')
    expect(content).toContain('overflow-y: auto')
    expect(lists).toContain('box-sizing: border-box')
    expect(lists).toContain('min-width: 0')
    expect(lists).toContain('width: 100%')
  })

  it('bounds the root inside the host flex leaf even for long unwrapped headings', async () => {
    const source = await stylesheet()
    const root = rule(source, '.outline-view')
    expect(root).toContain('width: 100%')
    expect(root).toContain('max-width: 100%')
    expect(root).toContain('flex: 1 1 0')
    expect(rule(source, '.outline-view__content')).toContain('min-width: 0')
    expect(rule(source, '.outline-view--truncate .outline-view__item')).toContain('text-overflow: ellipsis')
  })

  it('uses text-only active-heading emphasis', async () => {
    const source = await stylesheet()
    const active = rule(source, '.outline-view__item.is-active')

    expect(active).toContain('--active-file-border-color')
    expect(active).not.toContain('background:')
    expect(active).not.toContain('box-shadow:')
  })

  it('keeps the heading-level selector fixed, contained, and theme-aware', async () => {
    const source = await readFile(new URL('./selector.scss', import.meta.url), 'utf8')
    const selector = rule(source, '.outline-view__level-selector')
    const track = rule(source, '.outline-view__level-track')
    const included = rule(
      source,
      ".outline-view__level-stop[data-included='true'] .outline-view__level-mark",
    )
    const focus = rule(source, '.outline-view__range-handle:focus-visible')

    expect(selector).toContain('flex: 0 0 auto')
    expect(selector).toContain('min-width: 0')
    expect(selector).toContain('width: 100%')
    expect(track).toContain('min-width: 0')
    expect(selector).toContain('--active-file-border-color')
    expect(included).toContain('--range-accent')
    expect(focus).toContain('--range-accent')
  })
})
