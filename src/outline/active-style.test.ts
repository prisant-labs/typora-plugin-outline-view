import { compile } from 'sass'
import { afterEach, describe, expect, it } from 'vitest'
import { parseHeadings } from './parser'
import { renderOutline } from './render'
import { normalizeOutlineSettings } from '../settings/model'

const css = compile('src/style.scss').css
afterEach(() => document.body.replaceChildren())

describe('active heading fill and outline', () => {
  it.each(['wrap', 'truncate'])('targets only the current row in a nested %s outline', mode => {
    const activeRule = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .find(match => match[1].includes('.outline-view__row:has(') && match[1].includes('.is-active'))
    expect(activeRule, 'compiled fill-and-outline rule').toBeDefined()
    const selector = activeRule![1].trim()
    const editor = document.createElement('div')
    editor.innerHTML = '<h1 cid="parent">Parent</h1><h2 cid="child">Child with a very long heading</h2><h3 cid="grandchild">Grandchild</h3><h1 cid="sibling">Sibling</h1>'
    const outline = document.createElement('section')
    outline.className = `outline-view outline-view--${mode}`
    document.body.append(outline)
    renderOutline(outline, parseHeadings(editor), {
      activeKey: 'cid:child', collapsedKeys: new Set(), onNavigate: () => {}, onToggle: () => {},
      headingStyles: normalizeOutlineSettings({ headingStyles: { 2: { bold: true, italic: true, color: '#745299', size: 150 } } }).headingStyles,
    })
    const child = outline.querySelector<HTMLElement>('[data-heading-key="cid:child"]')!
    const parent = outline.querySelector<HTMLElement>('[data-heading-key="cid:parent"]')!
    const activeRows = () => [...outline.querySelectorAll(selector)]
    const childStyle = child.getAttribute('style')
    const rowStyle = child.parentElement!.getAttribute('style')

    expect(activeRows()).toEqual([child.parentElement])
    expect(child.parentElement!.querySelector('.outline-view__disclosure')).not.toBeNull()
    expect(child.getAttribute('aria-current')).toBe('location')
    child.classList.remove('is-active')
    parent.classList.add('is-active')
    expect(activeRows()).toEqual([parent.parentElement])
    parent.classList.remove('is-active')
    expect(activeRows()).toHaveLength(0)
    expect(child.getAttribute('style')).toBe(childStyle)
    expect(child.parentElement!.getAttribute('style')).toBe(rowStyle)
  })
})
