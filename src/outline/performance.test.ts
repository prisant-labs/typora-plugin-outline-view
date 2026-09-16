import { describe, expect, it, vi } from 'vitest'

import { parseHeadings } from './parser'
import { renderOutline } from './render'
import { buildOutlineTree } from './tree'

describe('large outline release check', () => {
  it('parses, structures, and renders 600 headings within the interaction budget', () => {
    const editor = document.createElement('div')
    editor.id = 'write'

    for (let index = 0; index < 600; index += 1) {
      const level = (index % 6) + 1
      const heading = document.createElement(`h${level}`)
      heading.setAttribute('cid', `large-${index}`)
      heading.textContent = `Heading ${index + 1}`
      editor.append(heading)
    }

    const container = document.createElement('div')
    const startedAt = performance.now()
    const headings = parseHeadings(editor)
    const tree = buildOutlineTree(headings)
    renderOutline(container, tree, {
      collapsedKeys: new Set(),
      onNavigate: vi.fn(),
      onToggle: vi.fn(),
    })
    const elapsedMs = performance.now() - startedAt

    expect(headings).toHaveLength(600)
    expect(container.querySelectorAll('.outline-view__item')).toHaveLength(600)
    expect(elapsedMs).toBeLessThan(2_000)
  })
})
