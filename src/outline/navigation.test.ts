import { afterEach, describe, expect, it } from 'vitest'

import type { OutlineHeading } from './model'
import { navigateToHeading } from './navigation'

const VIEWPORT_TOP = 40

// Lays out #write inside a scrolling <content> element; each heading sits at a
// fixed offset within the document, so its viewport position follows scrollTop.
function createEditor(offsets: Record<string, number>, initialScrollTop = 100) {
  const content = document.createElement('content')
  content.style.overflowY = 'auto'
  const editor = document.createElement('div')
  editor.id = 'write'
  editor.tabIndex = -1
  content.append(editor)
  document.body.append(content)

  const calls: string[] = []
  let scrollTop = initialScrollTop
  Object.defineProperties(content, {
    scrollHeight: { configurable: true, value: 20000 },
    clientHeight: { configurable: true, value: 800 },
    clientTop: { configurable: true, value: 0 },
    scrollTop: {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value
        calls.push(`scroll:${value}`)
      },
    },
  })
  content.getBoundingClientRect = () => ({ top: VIEWPORT_TOP }) as DOMRect

  const place = (element: HTMLElement, offset: number) => {
    element.getBoundingClientRect = () => ({ top: VIEWPORT_TOP + offset - scrollTop }) as DOMRect
  }
  for (const [cid, offset] of Object.entries(offsets)) {
    const element = document.createElement('h2')
    element.setAttribute('cid', cid)
    element.textContent = cid
    place(element, offset)
    editor.append(element)
  }

  return {
    calls,
    content,
    editor,
    place,
    heading(cid: string): OutlineHeading {
      const element = editor.querySelector<HTMLElement>(`[cid="${cid}"]`)!
      return { key: `cid:${cid}`, cid, level: 2, text: cid, element }
    },
  }
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('navigateToHeading', () => {
  it('focuses the editor, then scrolls its viewport so the heading is at the top', () => {
    const { calls, content, editor, heading } = createEditor({ intro: 0, target: 1500 })
    editor.focus = () => { calls.push('focus') }

    navigateToHeading(heading('target'))

    expect(calls).toEqual(['focus', 'scroll:1500'])
    expect(content.scrollTop).toBe(1500)
  })

  it('keeps the target when focusing the editor scrolls back to the caret', () => {
    // WebKit can reveal the restored caret on focus, even with preventScroll.
    const { content, editor, heading } = createEditor({ intro: 0, target: 1500 }, 700)
    editor.focus = () => { content.scrollTop = 0 }

    navigateToHeading(heading('target'))

    expect(content.scrollTop).toBe(1500)
  })

  it('does not refocus an editor that already has focus', () => {
    const { calls, editor, heading } = createEditor({ target: 900 })
    editor.focus()
    calls.length = 0
    editor.focus = () => { calls.push('focus') }

    navigateToHeading(heading('target'))

    expect(calls).toEqual(['scroll:900'])
  })

  it('navigates to a replacement element with the same cid', () => {
    const { content, editor, heading, place } = createEditor({ intro: 0, target: 1500 })
    const stale = heading('target')
    // Typora shows the focused heading as source in a paragraph with its level.
    const replacement = document.createElement('p')
    replacement.setAttribute('cid', 'target')
    replacement.setAttribute('mdlike', 'h2')
    place(replacement, 1520)
    stale.element.replaceWith(replacement)
    expect(editor.contains(stale.element)).toBe(false)

    navigateToHeading(stale)

    expect(content.scrollTop).toBe(1520)
  })

  it('does nothing when the heading is no longer in the document', () => {
    const { calls, editor, heading } = createEditor({ target: 900 })
    const removed = heading('target')
    editor.focus = () => { calls.push('focus') }
    removed.element.remove()

    expect(() => navigateToHeading(removed)).not.toThrow()
    expect(calls).toEqual([])
  })

  it('scrolls the document when the editor has no scroll container of its own', () => {
    const editor = document.createElement('div')
    editor.id = 'write'
    const element = document.createElement('h2')
    editor.append(element)
    document.body.append(editor)
    const root = document.scrollingElement ?? document.documentElement
    let scrollTop = 300
    Object.defineProperty(root, 'scrollTop', {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => { scrollTop = value },
    })
    element.getBoundingClientRect = () => ({ top: 1200 - scrollTop }) as DOMRect

    navigateToHeading({ key: 'heading:0', level: 2, text: 'Root', element })

    expect(scrollTop).toBe(1200)
    delete (root as Partial<HTMLElement>).scrollTop
  })

  it('does not throw when the editor cannot take focus', () => {
    const { content, editor, heading } = createEditor({ target: 900 })
    Object.defineProperty(editor, 'focus', { configurable: true, value: undefined })

    expect(() => navigateToHeading(heading('target'))).not.toThrow()
    expect(content.scrollTop).toBe(900)
  })
})
