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

  it('uses text-only active-heading emphasis', async () => {
    const source = await stylesheet()
    const active = rule(source, '.outline-view__item.is-active')

    expect(active).toContain('--active-file-border-color')
    expect(active).not.toContain('background:')
    expect(active).not.toContain('box-shadow:')
  })

  it('keeps the heading-level selector fixed, contained, and theme-aware', async () => {
    const source = await stylesheet()
    const selector = rule(source, '.outline-view__level-selector')
    const track = rule(source, '.outline-view__level-track')
    const included = rule(
      source,
      ".outline-view__level-stop[data-included='true']",
    )
    const focus = rule(source, '.outline-view__level-stop:focus-visible')

    expect(selector).toContain('flex: 0 0 auto')
    expect(selector).toContain('min-width: 0')
    expect(selector).toContain('width: 100%')
    expect(track).toContain('min-width: 0')
    expect(included).toContain('--active-file-border-color')
    expect(focus).toContain('--active-file-border-color')
  })
})
