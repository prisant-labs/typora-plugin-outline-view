import { describe, expect, it } from 'vitest'
import { applyOutlineAppearance, applyHeadingAppearance } from './appearance'
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
  it('removes overrides when reset so theme inheritance is restored', () => {
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
    expect(label.style.getPropertyValue('--outline-heading-weight')).toBe('')
    expect(label.style.getPropertyValue('--outline-heading-color')).toBe('')
    expect(label.style.textTransform).toBe('')
    expect(label.style.fontVariantCaps).toBe('')
  })
})
