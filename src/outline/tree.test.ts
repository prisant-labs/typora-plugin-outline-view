import { describe, expect, it } from 'vitest'

import type { HeadingLevel, OutlineHeading, OutlineNode } from './model'
import {
  buildOutlineTree,
  filterHeadings,
  flattenOutlineTree,
  focusOutlineTree,
  pathToOutlineNode,
} from './tree'

function heading(key: string, level: HeadingLevel): OutlineHeading {
  const element = document.createElement(`h${level}`)
  element.textContent = key
  return { key, level, text: key, element }
}

function shape(nodes: OutlineNode[]): unknown {
  return nodes.map(({ key, parentKey, children }) => ({
    key,
    parentKey,
    children: shape(children),
  }))
}

describe('buildOutlineTree', () => {
  it('builds ordinary hierarchy and preserves sibling order', () => {
    const tree = buildOutlineTree([
      heading('one', 1),
      heading('one-a', 2),
      heading('one-a-i', 3),
      heading('one-b', 2),
      heading('two', 1),
    ])

    expect(shape(tree)).toEqual([
      {
        key: 'one',
        parentKey: undefined,
        children: [
          {
            key: 'one-a',
            parentKey: 'one',
            children: [
              { key: 'one-a-i', parentKey: 'one-a', children: [] },
            ],
          },
          { key: 'one-b', parentKey: 'one', children: [] },
        ],
      },
      { key: 'two', parentKey: undefined, children: [] },
    ])
  })

  it('attaches skipped levels to the nearest preceding lower-level heading', () => {
    const tree = buildOutlineTree([
      heading('h2', 2),
      heading('h5', 5),
      heading('h6', 6),
      heading('h3', 3),
      heading('h6b', 6),
      heading('h2b', 2),
    ])

    expect(shape(tree)).toEqual([
      {
        key: 'h2',
        parentKey: undefined,
        children: [
          {
            key: 'h5',
            parentKey: 'h2',
            children: [{ key: 'h6', parentKey: 'h5', children: [] }],
          },
          {
            key: 'h3',
            parentKey: 'h2',
            children: [{ key: 'h6b', parentKey: 'h3', children: [] }],
          },
        ],
      },
      { key: 'h2b', parentKey: undefined, children: [] },
    ])
  })

  it('keeps duplicate labels as distinct nodes by stable key', () => {
    const tree = buildOutlineTree([
      { ...heading('first', 2), text: 'Repeated' },
      { ...heading('second', 2), text: 'Repeated' },
    ])

    expect(tree.map(({ key, text }) => ({ key, text }))).toEqual([
      { key: 'first', text: 'Repeated' },
      { key: 'second', text: 'Repeated' },
    ])
  })

  it('flattens a tree back into source order', () => {
    const tree = buildOutlineTree([
      heading('one', 1),
      heading('child', 3),
      heading('two', 1),
    ])

    expect(flattenOutlineTree(tree).map(({ key }) => key)).toEqual([
      'one',
      'child',
      'two',
    ])
  })

  it('finds the root-to-node path and returns an empty path for an unknown key', () => {
    const tree = buildOutlineTree([
      heading('root', 1), heading('sibling', 2), heading('parent', 2), heading('selected', 4), heading('child', 6),
    ])
    expect(pathToOutlineNode(tree, 'selected').map(({ key }) => key)).toEqual(['root', 'parent', 'selected'])
    expect(pathToOutlineNode(tree, 'missing')).toEqual([])
  })

  it('focuses the selected branch while preserving ancestors and the complete selected subtree', () => {
    const tree = buildOutlineTree([
      heading('root', 1), heading('sibling', 2), heading('parent', 2), heading('selected', 4), heading('child', 6),
      heading('other-root', 1), heading('other-child', 2),
    ])
    const before = shape(tree)

    expect(shape(focusOutlineTree(tree, 'selected'))).toEqual([{
      key: 'root', parentKey: undefined, children: [{
        key: 'parent', parentKey: 'root', children: [{
          key: 'selected', parentKey: 'parent', children: [
            { key: 'child', parentKey: 'selected', children: [] },
          ],
        }],
      }],
    }])
    expect(shape(tree)).toEqual(before)
    expect(focusOutlineTree(tree, 'missing')).toBe(tree)
  })
})

describe('filterHeadings', () => {
  it('keeps only headings inside the inclusive configured range', () => {
    const headings = [1, 2, 3, 4, 5, 6].map((level) =>
      heading(`h${level}`, level as HeadingLevel),
    )

    expect(filterHeadings(headings, 2, 4).map(({ key }) => key)).toEqual([
      'h2',
      'h3',
      'h4',
    ])
  })

  it('lets visible headings form a useful tree after ancestors are filtered', () => {
    const filtered = filterHeadings(
      [heading('h1', 1), heading('h2', 2), heading('h4', 4)],
      2,
      6,
    )

    expect(shape(buildOutlineTree(filtered))).toEqual([
      {
        key: 'h2',
        parentKey: undefined,
        children: [{ key: 'h4', parentKey: 'h2', children: [] }],
      },
    ])
  })
})
