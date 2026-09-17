import { compile } from 'sass'
import { afterEach, describe, expect, it } from 'vitest'

// CSS contract test against the core 2.10.21 DOM hierarchy, not a browser
// layout test. The missing constraint was on the host tabs, not the view root.
const css = compile('src/style.scss').css
const dockRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter(match => match[1].includes('.typ-workspace-sidedock'))
  .map(match => match[0]).join('\n')

function tabs(content: string) {
  return `<div class="typ-workspace-tabs"><div class="typ-workspace-tab-header">Outline</div><div class="typ-workspace-tab-content"><div class="typ-workspace-leaf mod-active">${content}</div></div></div>`
}

afterEach(() => document.body.replaceChildren())

describe('core side-dock width boundary', () => {
  it.each(['wrap', 'truncate'])('stretches the host tab group independently of %s content', mode => {
    const style = document.createElement('style')
    style.textContent = dockRules
    document.body.innerHTML = `<div class="typ-workspace-sidedock"><div class="sidedock-content">${tabs(`<section class="outline-view outline-view--${mode}"><h1>Short</h1></section>`)}</div></div>`
    document.body.append(style)
    const group = document.querySelector<HTMLElement>('.typ-workspace-tabs')!
    const check = () => {
      const computed = getComputedStyle(group)
      expect(computed.flexGrow).toBe('1')
      expect(computed.flexShrink).toBe('1')
      expect(computed.flexBasis).toBe('0px')
      expect(computed.minWidth).toBe('0px')
      expect(computed.maxWidth).toBe('100%')
      expect(computed.boxSizing).toBe('border-box')
    }
    check()
    group.querySelector('h1')!.textContent = 'A very long unbroken heading '.repeat(100)
    check()
    group.querySelector('.outline-view')!.remove()
    expect(getComputedStyle(group).flexGrow).not.toBe('1')
  })

  it('does not resize other dock tabs, normal workspace panes, or the settings preview', () => {
    document.body.innerHTML = `<div class="typ-workspace-sidedock"><div class="sidedock-content">${tabs('<section class="other-plugin">Other view</section>')}</div></div>${tabs('<section class="outline-view">Main pane</section>')}<section class="outline-view outline-view--preview">Preview</section>`
    const style = document.createElement('style')
    style.textContent = dockRules
    document.body.append(style)
    for (const group of document.querySelectorAll('.typ-workspace-tabs')) {
      expect(getComputedStyle(group).flexGrow).not.toBe('1')
    }
  })
})
