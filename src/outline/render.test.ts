import { describe, expect, it, vi } from 'vitest'

import type { HeadingLevel, OutlineHeading } from './model'
import { renderOutline } from './render'
import { buildOutlineTree } from './tree'

function heading(
  key: string,
  level: HeadingLevel,
  text = key,
): OutlineHeading {
  const element = document.createElement(`h${level}`)
  element.textContent = text
  return { key, level, text, element }
}

function options(overrides: Record<string, unknown> = {}) {
  return {
    collapsedKeys: new Set<string>(),
    activeKey: undefined,
    onNavigate: vi.fn(),
    onToggle: vi.fn(),
    ...overrides,
  }
}

describe('renderOutline', () => {
  it('renders a semantic nested tree in source order', () => {
    const container = document.createElement('div')
    const nodes = buildOutlineTree([
      heading('one', 1, 'One'),
      heading('three', 3, 'Three'),
      heading('two', 1, 'Two'),
    ])

    renderOutline(container, nodes, options())

    const tree = container.querySelector(':scope > [role="tree"]')
    const labels = Array.from(
      container.querySelectorAll<HTMLButtonElement>('.outline-view__item'),
    )
    const nestedGroup = container.querySelector('[role="group"]')

    expect(tree?.tagName).toBe('UL')
    expect(nestedGroup?.tagName).toBe('UL')
    expect(labels.map(({ textContent }) => textContent)).toEqual([
      'One',
      'Three',
      'Two',
    ])
    expect(labels[0].type).toBe('button')
    expect(labels[0].getAttribute('role')).toBe('treeitem')
    expect(labels[1].getAttribute('aria-level')).toBe('2')
    expect(labels[1].dataset.headingLevel).toBe('3')
    expect(labels[1].title).toBe('Three')
  })

  it('renders disclosure controls only for branches', () => {
    const container = document.createElement('div')
    const nodes = buildOutlineTree([
      heading('parent', 1, 'Parent'),
      heading('child', 2, 'Child'),
    ])

    renderOutline(container, nodes, options())

    const disclosures = container.querySelectorAll<HTMLButtonElement>(
      '.outline-view__disclosure',
    )
    expect(disclosures).toHaveLength(1)
    expect(disclosures[0].getAttribute('aria-expanded')).toBe('true')
    expect(disclosures[0].getAttribute('aria-label')).toBe('Collapse Parent')
  })

  it('hides descendants and exposes collapsed accessibility state', () => {
    const container = document.createElement('div')
    const nodes = buildOutlineTree([
      heading('parent', 1, 'Parent'),
      heading('child', 2, 'Child'),
    ])

    renderOutline(
      container,
      nodes,
      options({ collapsedKeys: new Set(['parent']) }),
    )

    const disclosure = container.querySelector<HTMLButtonElement>(
      '.outline-view__disclosure',
    )
    expect(disclosure?.getAttribute('aria-expanded')).toBe('false')
    expect(disclosure?.getAttribute('aria-label')).toBe('Expand Parent')
    expect(container.querySelector<HTMLElement>('[role="group"]')?.hidden).toBe(
      true,
    )
  })

  it('marks the active heading and its current location', () => {
    const container = document.createElement('div')
    const nodes = buildOutlineTree([heading('active', 2, 'Active')])

    renderOutline(container, nodes, options({ activeKey: 'active' }))

    const item = container.querySelector('.outline-view__item')
    expect(item?.classList.contains('is-active')).toBe(true)
    expect(item?.getAttribute('aria-current')).toBe('location')
  })

  it('invokes navigation and disclosure callbacks with selected nodes', () => {
    const container = document.createElement('div')
    const nodes = buildOutlineTree([
      heading('parent', 1),
      heading('child', 2),
    ])
    const onNavigate = vi.fn()
    const onToggle = vi.fn()

    renderOutline(container, nodes, options({ onNavigate, onToggle }))
    container.querySelector<HTMLButtonElement>('.outline-view__item')?.click()
    container
      .querySelector<HTMLButtonElement>('.outline-view__disclosure')
      ?.click()

    expect(onNavigate).toHaveBeenCalledWith(nodes[0])
    expect(onToggle).toHaveBeenCalledWith(nodes[0])
  })

  it('renders heading text as text rather than markup', () => {
    const container = document.createElement('div')
    const nodes = buildOutlineTree([
      heading('safe', 2, '<img src=x onerror=alert(1)>'),
    ])

    renderOutline(container, nodes, options())

    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.outline-view__item')?.textContent).toBe(
      '<img src=x onerror=alert(1)>',
    )
  })

  it('renders a configurable clear empty state', () => {
    const container = document.createElement('div')

    renderOutline(container, [], options({ emptyMessage: 'No visible headings.' }))

    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      'No visible headings.',
    )
  })

  it('replaces prior render output', () => {
    const container = document.createElement('div')
    const prior = document.createElement('span')
    prior.dataset.priorOutput = 'true'
    container.append(prior)

    renderOutline(
      container,
      buildOutlineTree([heading('heading', 2)]),
      options(),
    )

    expect(container.querySelector('[data-prior-output]')).toBeNull()
    expect(container.querySelectorAll('.outline-view__item')).toHaveLength(1)
  })
})
