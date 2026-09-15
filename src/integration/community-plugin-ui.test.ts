import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  openPluginSettings,
  relabelRightDockToggle,
} from './community-plugin-ui'

afterEach(() => document.body.replaceChildren())

describe('Community Plugin UI integration', () => {
  it('opens settings and selects the requested Community Plugins tab', () => {
    document.body.innerHTML = `
      <div class="typ-settings-modal">
        <button class="typ-nav__item" data-name="Another Plugin">Another Plugin</button>
        <button class="typ-nav__item" data-name="Outline View">Outline View</button>
      </div>
    `
    const outlineTab = document.querySelector<HTMLElement>(
      '[data-name="Outline View"]',
    )!
    const click = vi.spyOn(outlineTab, 'click')
    const app = { commands: { run: vi.fn() } }

    openPluginSettings(app, 'Outline View')

    expect(app.commands.run).toHaveBeenCalledWith('settings:open')
    expect(click).toHaveBeenCalledOnce()
  })

  it('changes only the exact core dock tooltip and restores its attributes', () => {
    document.body.innerHTML = `
      <footer class="ty-footer">
        <div id="dock" class="footer-item footer-item-right" ty-hint="Toggle right sidebar" aria-label="Toggle right sidebar"><i class="fa fa-align-right"></i></div>
        <div id="other" ty-hint="Another action" aria-label="Another action"></div>
      </footer>
    `

    const restore = relabelRightDockToggle()
    const dock = document.querySelector('#dock')!
    const other = document.querySelector('#other')!

    expect(dock.getAttribute('ty-hint')).toBe('Toggle outline sidebar')
    expect(dock.getAttribute('aria-label')).toBe('Toggle outline sidebar')
    expect(other.getAttribute('ty-hint')).toBe('Another action')

    restore()

    expect(dock.getAttribute('ty-hint')).toBe('Toggle right sidebar')
    expect(dock.getAttribute('aria-label')).toBe('Toggle right sidebar')
  })

  it('recognizes the core dock button when its tooltip is localized', () => {
    document.body.innerHTML = `
      <footer class="ty-footer">
        <div id="dock" class="footer-item footer-item-right" ty-hint="Rechte Seitenleiste umschalten" aria-label="Rechte Seitenleiste umschalten"><i class="fa fa-align-right"></i></div>
      </footer>
    `

    const restore = relabelRightDockToggle()
    const dock = document.querySelector('#dock')!
    expect(dock.getAttribute('ty-hint')).toBe('Toggle outline sidebar')

    restore()
    expect(dock.getAttribute('ty-hint')).toBe(
      'Rechte Seitenleiste umschalten',
    )
  })

  it('safely does nothing when the expected framework elements are unavailable', () => {
    const app = { commands: { run: vi.fn() } }

    expect(() => openPluginSettings(app, 'Outline View')).not.toThrow()
    expect(() => relabelRightDockToggle()()).not.toThrow()
  })
})
