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
  it('keeps the local-folder masthead action slightly smaller than the metadata row', async () => {
    const source = await readFile(new URL('./settings.scss', import.meta.url), 'utf8')
    const folder = rule(source, '.outline-view-settings__folder')
    const icon = rule(source, '.outline-view-settings__folder svg')
    expect(folder).toContain('min-height: 24px')
    expect(folder).toContain('padding: 2px 6px')
    expect(folder).toContain('font-size: 10px')
    expect(icon).toContain('width: 12px')
    expect(icon).toContain('height: 12px')
  })

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

  it('styles native appearance color controls without an external picker component', async () => {
    const source = await readFile(new URL('./settings.scss', import.meta.url), 'utf8')
    expect(rule(source, ".outline-view-settings__color-details input[type='color']")).toContain('cursor: pointer')
    expect(rule(source, '.outline-view-settings__color-details')).toContain('display: grid')
    expect(rule(source, '.outline-view-settings__color-details[hidden]')).toContain('display: none !important')
    expect(rule(source, ".outline-view-settings__opacity input[type='range']")).toContain('accent-color:')
    expect(source).toContain("[data-action='reset-outline-appearance']")
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

  it('fills and outlines only the active row without overriding typography or changing geometry', async () => {
    const source = await stylesheet()
    const active = rule(source, '.outline-view__row:has(> .outline-view__item.is-active)')
    expect(active).toContain('background: var(--active-file-bg-color, var(--item-hover-bg-color, rgba(127, 127, 127, .12)))')
    expect(active).toContain('box-shadow: inset 0 0 0 1px var(--active-file-border-color, var(--text-color, currentColor))')
    // Paint only: inset outline cannot shift padding/borders or override text styles.
    expect(active.trim().split(';').filter(value => value.trim())).toHaveLength(2)
    expect(source).not.toContain('.outline-view__item.is-active::before')
    expect(rule(source, '.outline-view__item:focus-visible')).toContain('box-shadow: inset 0 0 0 1px var(--active-file-border-color)')
  })

  it('draws bottom-complete guides and keeps zebra, hover, and active precedence explicit', async () => {
    const source = await stylesheet()
    const guides = rule(source, '.outline-view--guides .outline-view__group::before')
    expect(guides).toContain('bottom: 0')
    expect(guides).toContain('background: var(--outline-guide-color)')
    // :where keeps stripes at (0,2,0), tied with hover and below active (0,3,0).
    // Source order alone cannot make hover override the former (0,3,0) stripes.
    expect(rule(source, '.outline-view--zebra .outline-view__row:where(.is-zebra-a)')).toContain('background: var(--outline-zebra-a)')
    expect(rule(source, '.outline-view--zebra .outline-view__row:where(.is-zebra-b)')).toContain('background: var(--outline-zebra-b)')
    expect(source.indexOf('.outline-view--zebra .outline-view__row:where(.is-zebra-b)')).toBeLessThan(source.indexOf('.outline-view__row:hover'))
    expect(source.indexOf('.outline-view__row:hover')).toBeLessThan(source.indexOf('.outline-view__row:has(> .outline-view__item.is-active)'))
  })

  it('styles section landmarks, active ancestry, current path, and compact disclosure symbols', async () => {
    const source = await stylesheet()
    expect(rule(source, '.outline-view--sections-space .outline-view__tree > .outline-view__node + .outline-view__node')).toContain('margin-block-start: 10px')
    expect(rule(source, '.outline-view--sections-divider .outline-view__tree > .outline-view__node + .outline-view__node')).toContain('border-top: 1px solid')
    expect(rule(source, '.outline-view--active-path .outline-view__row.is-active-path > .outline-view__item')).toContain('font-weight: 600')
    expect(rule(source, '.outline-view__current-path')).toContain('overflow-x: auto')
    expect(rule(source, '.outline-view__current-path')).toContain('flex: 0 0 auto')
    expect(rule(source, '.outline-view__bullet')).toContain('width: 4px')
    expect(source).toMatch(/\.outline-view__item\s*\{[^}]*padding-inline-start: 2px/)
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
