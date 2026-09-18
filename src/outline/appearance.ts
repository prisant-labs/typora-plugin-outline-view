import type { HeadingAppearance, OutlineSettings } from '../settings/model'

export function applyOutlineAppearance(container: HTMLElement, settings: OutlineSettings) {
  for (const name of ['compact', 'comfortable', 'indent-small', 'indent-medium', 'indent-large', 'wrap', 'truncate']) {
    container.classList.remove(`outline-view--${name}`)
  }
  container.classList.add(`outline-view--${settings.density}`, `outline-view--indent-${settings.indentation}`, settings.wrapHeadingLabels ? 'outline-view--wrap' : 'outline-view--truncate')
}

export function applyHeadingAppearance(row: HTMLElement, label: HTMLElement, style: HeadingAppearance) {
  // A row is a sibling of its child group, so percentages never compound by depth.
  row.style.fontSize = `${style.size}%`
  // The active row fill and outline are separate, so these styles apply in both states.
  label.style.setProperty('--outline-heading-weight', style.bold ? '700' : 'normal')
  label.style.fontStyle = style.italic ? 'italic' : 'normal'
  label.style.textDecoration = style.underline ? 'underline' : 'none'
  label.style.textTransform = style.casing === 'uppercase' ? 'uppercase' : style.casing === 'small-caps' ? 'none' : ''
  label.style.fontVariantCaps = style.casing === 'small-caps' ? 'small-caps' : style.casing === 'uppercase' ? 'normal' : ''
  label.style.setProperty('--outline-heading-color', style.color ?? '')
}
