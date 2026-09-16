import { describe, expect, it, vi } from 'vitest'

import type { OutlineHeading } from './model'
import { navigateToHeading } from './navigation'

function createHeading(): OutlineHeading {
  const editor = document.createElement('div')
  editor.id = 'write'
  editor.tabIndex = -1

  const element = document.createElement('h2')
  element.textContent = 'Target'
  editor.append(element)
  document.body.append(editor)

  return {
    key: 'target',
    level: 2,
    text: 'Target',
    element,
  }
}

describe('navigateToHeading', () => {
  it('scrolls the live heading into view and returns focus to the editor', () => {
    const heading = createHeading()
    const scrollIntoView = vi.fn()
    const focus = vi.spyOn(heading.element.closest<HTMLElement>('#write')!, 'focus')
    heading.element.scrollIntoView = scrollIntoView

    navigateToHeading(heading)

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('does not throw when optional DOM methods are unavailable', () => {
    const heading = createHeading()
    Object.defineProperty(heading.element, 'scrollIntoView', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(heading.element.closest('#write'), 'focus', {
      configurable: true,
      value: undefined,
    })

    expect(() => navigateToHeading(heading)).not.toThrow()
  })
})
