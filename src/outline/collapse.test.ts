import { describe, expect, it } from 'vitest'

import type { HeadingLevel, OutlineHeading } from './model'
import {
  collapseAll,
  createCollapsedState,
  expandAll,
  revealAncestors,
  toggleCollapsed,
} from './collapse'
import { buildOutlineTree } from './tree'

function heading(key: string, level: HeadingLevel): OutlineHeading {
  const element = document.createElement(`h${level}`)
  return { key, level, text: key, element }
}

function tree() {
  return buildOutlineTree([
    heading('h1', 1),
    heading('h2', 2),
    heading('h3', 3),
    heading('h4', 4),
    heading('h5-leaf', 5),
    heading('h2-leaf', 2),
    heading('second-root', 1),
  ])
}

describe('outline collapse state', () => {
  it('initially collapses branches at the configured expansion boundary', () => {
    expect([...createCollapsedState(tree(), 3)]).toEqual(['h3', 'h4'])
  })

  it('never stores leaf headings as collapsed', () => {
    expect([...collapseAll(tree())]).toEqual(['h1', 'h2', 'h3', 'h4'])
  })

  it('uses valid remembered branch state when supplied', () => {
    expect(
      [
        ...createCollapsedState(tree(), 3, {
          collapsedKeys: new Set(['h2', 'missing', 'h5-leaf']),
          knownBranchKeys: new Set(['h1', 'h2', 'h3', 'h4']),
        }),
      ],
    ).toEqual(['h2'])
  })

  it('applies configured defaults to branches added after state was remembered', () => {
    const previous = buildOutlineTree([
      heading('h1', 1),
      heading('h2', 2),
    ])
    const remembered = {
      collapsedKeys: new Set<string>(),
      knownBranchKeys: collapseAll(previous),
    }
    const withNewBranch = buildOutlineTree([
      heading('h1', 1),
      heading('h2', 2),
      heading('new-h3', 3),
      heading('new-h4', 4),
    ])

    expect([...createCollapsedState(withNewBranch, 3, remembered)]).toEqual([
      'new-h3',
    ])
  })

  it('preserves an explicit expansion for a previously known branch', () => {
    expect(
      [
        ...createCollapsedState(tree(), 3, {
          collapsedKeys: new Set(),
          knownBranchKeys: new Set(['h1', 'h2', 'h3', 'h4']),
        }),
      ],
    ).toEqual([])
  })

  it('toggles a branch without mutating the previous set', () => {
    const previous = new Set(['h3'])
    const expanded = toggleCollapsed(previous, 'h3')
    const collapsedAgain = toggleCollapsed(expanded, 'h3')

    expect([...previous]).toEqual(['h3'])
    expect([...expanded]).toEqual([])
    expect([...collapsedAgain]).toEqual(['h3'])
  })

  it('expands and collapses every branch', () => {
    expect([...expandAll()]).toEqual([])
    expect([...collapseAll(tree())]).toEqual(['h1', 'h2', 'h3', 'h4'])
  })

  it('reveals every ancestor of the active heading', () => {
    const collapsed = new Set(['h1', 'h2', 'h3', 'h4'])

    expect([...revealAncestors(tree(), collapsed, 'h5-leaf')]).toEqual([])
    expect([...collapsed]).toEqual(['h1', 'h2', 'h3', 'h4'])
  })

  it('leaves state unchanged when the active key is absent', () => {
    expect([...revealAncestors(tree(), new Set(['h2']), 'missing')]).toEqual([
      'h2',
    ])
  })
})
