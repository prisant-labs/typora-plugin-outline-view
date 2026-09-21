import { describe, expect, it, vi } from 'vitest'
import {
  applyOutlineAppearance,
  applyHeadingAppearance,
  isDarkColor,
  observeThemeChanges,
} from './appearance'
import { normalizeOutlineSettings } from '../settings/model'

describe('outline appearance', () => {
  it('applies independent size, emphasis, casing and custom color without changing text', () => {
    const row = document.createElement('div')
    const label = document.createElement('button')
    label.textContent = 'Mixed Case'
    const settings = normalizeOutlineSettings({ headingStyles: { 2: { size: 150, bold: false, italic: true, underline: true, casing: 'small-caps', color: '#aabbcc' } } })
    applyHeadingAppearance(row, label, settings.headingStyles[2])
    expect(row.style.fontSize).toBe('150%')
    expect(label.style.getPropertyValue('--outline-heading-weight')).toBe('normal')
    expect(label.style.fontWeight).toBe('')
    expect(label.style.fontStyle).toBe('italic')
    expect(label.style.textDecoration).toBe('underline')
    expect(label.style.fontVariantCaps).toBe('small-caps')
    expect(label.style.getPropertyValue('--outline-heading-color')).toBe('#aabbcc')
    expect(label.style.color).toBe('')
    expect(label.textContent).toBe('Mixed Case')
  })
  it('resets emphasis to off and restores theme color', () => {
    const root = document.createElement('section')
    applyOutlineAppearance(root, normalizeOutlineSettings({ density: 'compact', wrapHeadingLabels: false }))
    applyOutlineAppearance(root, normalizeOutlineSettings())
    expect(root.classList.contains('outline-view--compact')).toBe(false)
    expect(root.classList.contains('outline-view--wrap')).toBe(true)
    const row = document.createElement('div')
    const label = document.createElement('button')
    applyHeadingAppearance(row, label, normalizeOutlineSettings({ headingStyles: { 1: { bold: true, casing: 'uppercase', color: '#ffffff' } } }).headingStyles[1])
    applyHeadingAppearance(row, label, normalizeOutlineSettings().headingStyles[1])
    expect(label.style.color).toBe('')
    expect(label.style.fontWeight).toBe('')
    expect(label.style.getPropertyValue('--outline-heading-weight')).toBe('normal')
    expect(label.style.fontStyle).toBe('normal')
    expect(label.style.textDecoration).toBe('none')
    expect(label.style.getPropertyValue('--outline-heading-color')).toBe('')
    expect(label.style.textTransform).toBe('')
    expect(label.style.fontVariantCaps).toBe('')
  })

  it('applies structural classes and resolves separate dark custom colors with opacity', () => {
    const root = document.createElement('section')
    root.style.backgroundColor = 'rgb(20, 24, 28)'
    document.body.append(root)
    applyOutlineAppearance(root, normalizeOutlineSettings({
      showVerticalGuides: true,
      verticalGuideStrength: 'clear',
      verticalGuideColor: { source: 'custom', light: '#aabbcc', dark: '#112233', opacity: 50 },
      zebraRows: true,
      zebraRowAColor: { source: 'custom', light: '#f0f0f0', dark: '#202428', opacity: 80 },
      zebraRowBColor: { source: 'custom', light: '#556677', dark: '#010203', sameInBothThemes: true, opacity: 25 },
      sectionSeparation: 'divider',
      emphasizeActivePath: true,
    }))
    expect(root.classList).toContain('outline-view--guides')
    expect(root.classList).toContain('outline-view--guides-clear')
    expect(root.classList).toContain('outline-view--zebra')
    expect(root.classList).toContain('outline-view--sections-divider')
    expect(root.classList).toContain('outline-view--active-path')
    expect(root.dataset.appearanceTheme).toBe('dark')
    expect(root.style.getPropertyValue('--outline-guide-color')).toBe('rgba(17, 34, 51, 0.5)')
    expect(root.style.getPropertyValue('--outline-zebra-a')).toBe('rgba(32, 36, 40, 0.8)')
    expect(root.style.getPropertyValue('--outline-zebra-b')).toBe('rgba(85, 102, 119, 0.25)')
  })

  it('uses theme and plugin-default tokens and overwrites stale custom variables', () => {
    const root = document.createElement('section')
    root.style.backgroundColor = 'rgb(250, 250, 250)'
    document.body.append(root)
    applyOutlineAppearance(root, normalizeOutlineSettings({
      verticalGuideColor: { source: 'custom', light: '#112233' },
      zebraRowAColor: { source: 'custom', light: '#223344' },
      zebraRowBColor: { source: 'custom', light: '#334455' },
    }))
    applyOutlineAppearance(root, normalizeOutlineSettings({
      verticalGuideColor: { source: 'theme' },
      zebraRowAColor: { source: 'default' },
      zebraRowBColor: { source: 'theme' },
    }))
    expect(root.dataset.appearanceTheme).toBe('light')
    expect(root.style.getPropertyValue('--outline-guide-color')).toBe('var(--base-border, rgba(127, 127, 127, .35))')
    expect(root.style.getPropertyValue('--outline-zebra-a')).toBe('#ffffff')
    expect(root.style.getPropertyValue('--outline-zebra-b')).toContain('color-mix')
  })

  it('detects light and dark CSS colors', () => {
    expect(isDarkColor('#111111')).toBe(true)
    expect(isDarkColor('rgb(250, 250, 250)')).toBe(false)
    expect(isDarkColor('rgba(0, 0, 0, 0)')).toBeUndefined()
    expect(isDarkColor('not-a-color')).toBeUndefined()
  })

  it('observes theme-related DOM changes and releases its observer', async () => {
    const changed = vi.fn()
    const dispose = observeThemeChanges(changed)
    document.documentElement.setAttribute('data-test-theme', 'dark')
    await Promise.resolve(); await Promise.resolve()
    expect(changed).toHaveBeenCalled()
    const calls = changed.mock.calls.length
    dispose()
    document.documentElement.setAttribute('data-test-theme', 'light')
    await Promise.resolve(); await Promise.resolve()
    expect(changed).toHaveBeenCalledTimes(calls)
  })
})
