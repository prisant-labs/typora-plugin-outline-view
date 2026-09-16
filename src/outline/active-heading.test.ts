import { describe, expect, it } from 'vitest'

import type { OutlineHeading } from './model'
import {
  isEditorAtBottom,
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
    const editor = document.createElement('div')
    scroller.append(editor)
    Object.defineProperties(scroller, {
      scrollHeight: { configurable: true, value: 1000 },
      clientHeight: { configurable: true, value: 400 },
      scrollTop: { configurable: true, value: 200 },
    })

    expect(isEditorAtBottom(editor)).toBe(false)
  })
})
