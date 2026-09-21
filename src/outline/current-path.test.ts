import { describe, expect, it, vi } from 'vitest'
import type { HeadingLevel, OutlineNode } from './model'
import { createCurrentPath, renderCurrentPath } from './current-path'

function node(key: string, text: string, level: HeadingLevel): OutlineNode {
  const element = document.createElement(`h${level}`)
  return { key, text, level, element, children: [] }
}

describe('current outline path', () => {
  it('renders an accessible clickable root-to-current path', () => {
    const path = [node('root', 'Field notes', 1), node('section', 'Research', 2), node('active', 'Observations', 3)]
    const navigate = vi.fn()
    const bar = createCurrentPath()
    renderCurrentPath(bar, path, navigate, true)

    expect(bar.hidden).toBe(false)
    expect(bar.getAttribute('aria-label')).toBe('Current outline path')
    expect(Array.from(bar.querySelectorAll('button')).map(button => button.textContent)).toEqual(['Field notes', 'Research', 'Observations'])
    expect(bar.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2)
    bar.querySelectorAll('button')[1].click()
    expect(navigate).toHaveBeenCalledWith(path[1])
  })

  it('clears and hides when disabled or no path is available', () => {
    const bar = createCurrentPath()
    renderCurrentPath(bar, [node('root', 'Root', 1)], vi.fn(), true)
    renderCurrentPath(bar, [], vi.fn(), true)
    expect(bar.hidden).toBe(true)
    expect(bar.childNodes).toHaveLength(0)
    renderCurrentPath(bar, [node('root', 'Root', 1)], vi.fn(), false)
    expect(bar.hidden).toBe(true)
    expect(bar.childNodes).toHaveLength(0)
  })
})
