import { describe, expect, it } from 'vitest'

import { parseHeadings } from './parser'

function createEditor(markup: string) {
  const root = document.createElement('div')
  root.id = 'write'
  root.innerHTML = markup
  return root
}

describe('parseHeadings', () => {
  it('parses direct H1-H6 children in source order', () => {
    const root = createEditor(
      '<h1 cid="a">One</h1><p>Body</p><h3 cid="b">Three</h3><h6 cid="c">Six</h6>',
    )

    expect(
      parseHeadings(root).map(({ cid, level, text }) => ({ cid, level, text })),
    ).toEqual([
      { cid: 'a', level: 1, text: 'One' },
      { cid: 'b', level: 3, text: 'Three' },
      { cid: 'c', level: 6, text: 'Six' },
    ])
  })

  it('ignores nested headings and non-heading elements', () => {
    const root = createEditor(
      '<section><h2>Nested</h2></section><p>Body</p><div role="heading">Not a heading</div>',
    )

    expect(parseHeadings(root)).toEqual([])
  })

  it('supports duplicate heading text without merging entries', () => {
    const root = createEditor(
      '<h2 cid="first">Repeated</h2><h2 cid="second">Repeated</h2>',
    )

    const headings = parseHeadings(root)

    expect(headings).toHaveLength(2)
    expect(headings.map(({ key }) => key)).toEqual([
      'cid:first',
      'cid:second',
    ])
  })

  it('normalizes heading whitespace and labels empty headings', () => {
    const root = createEditor(
      '<h2>  A   heading\n with space  </h2><h3>   </h3>',
    )

    expect(parseHeadings(root).map(({ key, text }) => ({ key, text }))).toEqual([
      { key: 'heading:0', text: 'A heading with space' },
      { key: 'heading:1', text: 'Untitled heading' },
    ])
  })

  it('treats a blank cid as missing', () => {
    const root = createEditor('<h1 cid="  ">One</h1>')

    expect(parseHeadings(root)[0]).toMatchObject({
      cid: undefined,
      key: 'heading:0',
    })
  })

  it('keeps fallback keys stable when an earlier heading is inserted', () => {
    const root = createEditor('<h2>Branch</h2><h3>Child</h3>')
    const branch = root.children[0]
    const child = root.children[1]
    const original = parseHeadings(root)
    const inserted = document.createElement('h1')
    inserted.textContent = 'Inserted'
    root.insertBefore(inserted, branch)

    const reparsed = parseHeadings(root)

    expect(reparsed.find(({ element }) => element === branch)?.key).toBe(
      original[0].key,
    )
    expect(reparsed.find(({ element }) => element === child)?.key).toBe(
      original[1].key,
    )
    expect(reparsed[0].key).not.toBe(original[0].key)
  })

  it('returns an empty list when the editor is unavailable', () => {
    expect(parseHeadings(null)).toEqual([])
  })
})
