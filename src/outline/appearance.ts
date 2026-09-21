import type { AppearanceColor, HeadingAppearance, OutlineSettings } from '../settings/model'

type AppearanceColorRole = 'guide' | 'zebra-a' | 'zebra-b'

const DEFAULT_COLORS: Record<AppearanceColorRole, { light: string; dark: string }> = {
  guide: { light: '#cbd0d4', dark: '#505861' },
  'zebra-a': { light: '#ffffff', dark: '#24272c' },
  'zebra-b': { light: '#f5f6f7', dark: '#2c3036' },
}

const THEME_COLORS: Record<AppearanceColorRole, string> = {
  guide: 'var(--base-border, rgba(127, 127, 127, .35))',
  'zebra-a': 'var(--bg-color, transparent)',
  'zebra-b': 'color-mix(in srgb, var(--text-color, #555) 4%, var(--bg-color, transparent))',
}

function parseColor(value: string) {
  const hex = value.trim().match(/^#([0-9a-f]{6})$/i)?.[1]
  if (hex) return {
    red: Number.parseInt(hex.slice(0, 2), 16),
    green: Number.parseInt(hex.slice(2, 4), 16),
    blue: Number.parseInt(hex.slice(4, 6), 16),
    alpha: 1,
  }
  const rgb = value.trim().match(/^rgba?\(\s*([\d.]+)[, ]+\s*([\d.]+)[, ]+\s*([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/i)
  if (!rgb) return undefined
  return {
    red: Number(rgb[1]), green: Number(rgb[2]), blue: Number(rgb[3]),
    alpha: rgb[4] === undefined ? 1 : Number(rgb[4]),
  }
}

export function isDarkColor(value: string): boolean | undefined {
  const color = parseColor(value)
  if (!color || color.alpha === 0) return undefined
  const channel = (value: number) => {
    const normalized = value / 255
    return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4
  }
  const luminance = .2126 * channel(color.red) + .7152 * channel(color.green) + .0722 * channel(color.blue)
  return luminance < .35
}

function usesDarkSurface(container: HTMLElement) {
  const candidates = [
    getComputedStyle(container).backgroundColor,
    getComputedStyle(container).getPropertyValue('--bg-color'),
    document.body ? getComputedStyle(document.body).backgroundColor : '',
    getComputedStyle(document.documentElement).getPropertyValue('--bg-color'),
    getComputedStyle(document.documentElement).backgroundColor,
  ]
  for (const candidate of candidates) {
    const result = isDarkColor(candidate)
    if (result !== undefined) return result
  }
  return false
}

function withOpacity(hex: string, opacity: number) {
  const color = parseColor(hex)!
  const alpha = Math.round(opacity) / 100
  if (alpha === 1) return hex.toLowerCase()
  return `rgba(${color.red}, ${color.green}, ${color.blue}, ${alpha})`
}

function resolveAppearanceColor(value: AppearanceColor, role: AppearanceColorRole, dark: boolean) {
  if (value.source === 'theme') return THEME_COLORS[role]
  if (value.source === 'default') return DEFAULT_COLORS[role][dark ? 'dark' : 'light']
  const custom = dark && !value.sameInBothThemes ? value.dark : value.light
  return withOpacity(custom, value.opacity)
}

export function applyOutlineAppearance(container: HTMLElement, settings: OutlineSettings) {
  for (const name of [
    'compact', 'comfortable', 'indent-small', 'indent-medium', 'indent-large', 'wrap', 'truncate',
    'guides', 'guides-clear', 'zebra', 'sections-none', 'sections-space', 'sections-divider', 'active-path',
  ]) {
    container.classList.remove(`outline-view--${name}`)
  }
  container.classList.add(
    `outline-view--${settings.density}`,
    `outline-view--indent-${settings.indentation}`,
    settings.wrapHeadingLabels ? 'outline-view--wrap' : 'outline-view--truncate',
    `outline-view--sections-${settings.sectionSeparation}`,
  )
  container.classList.toggle('outline-view--guides', settings.showVerticalGuides)
  container.classList.toggle('outline-view--guides-clear', settings.showVerticalGuides && settings.verticalGuideStrength === 'clear')
  container.classList.toggle('outline-view--zebra', settings.zebraRows)
  container.classList.toggle('outline-view--active-path', settings.emphasizeActivePath)

  const dark = usesDarkSurface(container)
  container.dataset.appearanceTheme = dark ? 'dark' : 'light'
  container.style.setProperty('--outline-guide-color', resolveAppearanceColor(settings.verticalGuideColor, 'guide', dark))
  container.style.setProperty('--outline-zebra-a', resolveAppearanceColor(settings.zebraRowAColor, 'zebra-a', dark))
  container.style.setProperty('--outline-zebra-b', resolveAppearanceColor(settings.zebraRowBColor, 'zebra-b', dark))
}

export function observeThemeChanges(callback: () => void, root: Document = document) {
  let queued = false
  const schedule = () => {
    if (queued) return
    queued = true
    queueMicrotask(() => {
      if (!queued) return
      queued = false
      callback()
    })
  }
  const observer = new MutationObserver(schedule)
  observer.observe(root.documentElement, { attributes: true })
  if (root.head) observer.observe(root.head, { attributes: true, childList: true, subtree: true })
  if (root.body) observer.observe(root.body, { attributes: true })
  const media = root.defaultView?.matchMedia?.('(prefers-color-scheme: dark)')
  media?.addEventListener?.('change', schedule)
  return () => {
    queued = false
    observer.disconnect()
    media?.removeEventListener?.('change', schedule)
  }
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
