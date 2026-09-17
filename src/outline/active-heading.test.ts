import { describe, expect, it } from 'vitest'

import type { OutlineHeading } from './model'
import {
  isEditorAtBottom,
  getEditorViewportTop,
  selectActiveHeading,
} from './active-heading'

function heading(key: string, top: number): OutlineHeading {
  const element = document.createElement('h2')
  element.getBoundingClientRect = () =>
    ({ top }) as unknown as DOMRect
  return { key, level: 2, text: key, element }
}

describe('selectActiveHeading', () => {
  it('returns undefined for an empty outline', () => {
    expect(selectActiveHeading([], { thresholdTop: 80 })).toBeUndefined()
  })

  it('selects the first heading above the document start', () => {
    const headings = [heading('first', 120), heading('second', 240)]

    expect(selectActiveHeading(headings, { thresholdTop: 80 })?.key).toBe(
      'first',
    )
  })

  it('selects the final heading that crossed the threshold', () => {
    const headings = [
      heading('first', -100),
      heading('second', 80),
      heading('third', 200),
    ]

    expect(selectActiveHeading(headings, { thresholdTop: 80 })?.key).toBe(
      'second',
    )
  })

  it('selects the final heading at the document bottom', () => {
    const headings = [heading('first', -300), heading('last', 500)]

    expect(
      selectActiveHeading(headings, {
        thresholdTop: 80,
        atDocumentEnd: true,
      })?.key,
    ).toBe('last')
  })
})

describe('isEditorAtBottom', () => {
  it('uses the nearest scrollable ancestor', () => {
    const scroller = document.createElement('div')
    scroller.style.overflowY = 'auto'
    const editor = document.createElement('div')
    scroller.append(editor)
    Object.defineProperties(scroller, {
      scrollHeight: { configurable: true, value: 1000 },
      clientHeight: { configurable: true, value: 400 },
      scrollTop: { configurable: true, value: 599 },
    })

    expect(isEditorAtBottom(editor)).toBe(true)
  })

  it('returns false when a scrollable ancestor is not at the bottom', () => {
    const scroller = document.createElement('div')
    scroller.style.overflowY = 'auto'
    const editor = document.createElement('div')
    scroller.append(editor)
    Object.defineProperties(scroller, {
      scrollHeight: { configurable: true, value: 1000 },
      clientHeight: { configurable: true, value: 400 },
      scrollTop: { configurable: true, value: 200 },
    })

    expect(isEditorAtBottom(editor)).toBe(false)
  })

  it('ignores overflowing non-scroll containers when locating the editor viewport', () => {
    const scroller = document.createElement('div')
    const wrapper = document.createElement('div')
    const editor = document.createElement('div')
    scroller.style.overflowY = 'auto'
    wrapper.style.overflowY = 'visible'
    scroller.append(wrapper)
    wrapper.append(editor)
    Object.defineProperties(scroller, {
      scrollHeight: { value: 1600 }, clientHeight: { value: 600 }, clientTop: { value: 2 },
    })
    Object.defineProperties(wrapper, {
      scrollHeight: { value: 1000 }, clientHeight: { value: 400 }, scrollTop: { value: 600 },
    })
    scroller.getBoundingClientRect = () => ({ top: 50 }) as DOMRect
    expect(isEditorAtBottom(editor)).toBe(false)
    expect(getEditorViewportTop(editor)).toBe(52)
    scroller.scrollTop = 1000
    expect(isEditorAtBottom(editor)).toBe(true)
  })

  it('uses viewport zero for root scrolling even though the root rectangle moves', () => {
    const doc = document.implementation.createHTMLDocument('Root scroll fixture')
    const editor = doc.createElement('div')
    doc.body.append(editor)
    Object.defineProperty(doc, 'scrollingElement', { value: doc.documentElement })
    Object.defineProperties(doc.documentElement, {
      scrollHeight: { value: 1400 }, clientHeight: { value: 400 },
    })
    doc.documentElement.getBoundingClientRect = () => ({ top: -1000 }) as DOMRect
    doc.documentElement.scrollTop = 1000
    expect(getEditorViewportTop(editor)).toBe(0)
    expect(isEditorAtBottom(editor)).toBe(true)
  })

  it('skips an auto-overflow wrapper that has no scroll range of its own', () => {
    const scroller = document.createElement('div')
    const wrapper = document.createElement('div')
    const editor = document.createElement('div')
    scroller.style.overflowY = 'auto'
    wrapper.style.overflowY = 'auto'
    scroller.append(wrapper)
    wrapper.append(editor)
    Object.defineProperties(scroller, {
      scrollHeight: { value: 1600 }, clientHeight: { value: 600 },
    })
    Object.defineProperties(wrapper, {
      scrollHeight: { value: 1200 }, clientHeight: { value: 1200 },
    })
    scroller.getBoundingClientRect = () => ({ top: 50 }) as DOMRect
    wrapper.getBoundingClientRect = () => ({ top: -200 }) as DOMRect
    expect(getEditorViewportTop(editor)).toBe(50)
    scroller.scrollTop = 1000
    expect(isEditorAtBottom(editor)).toBe(true)
  })

  it('can use the editor itself if a host makes it the scroll container', () => {
    const editor = document.createElement('div')
    editor.style.overflowY = 'scroll'
    Object.defineProperties(editor, {
      scrollHeight: { value: 1000 }, clientHeight: { value: 400 }, clientTop: { value: 1 },
    })
    editor.getBoundingClientRect = () => ({ top: 40 }) as DOMRect
    editor.scrollTop = 600
    expect(isEditorAtBottom(editor)).toBe(true)
    expect(getEditorViewportTop(editor)).toBe(41)
  })
})
