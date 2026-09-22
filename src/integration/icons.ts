import type { CollapseIcon } from '../settings/model'

/** Small DOM-native icons remain visible without the host's icon font. */
export function outlineIcon(kind: 'settings' | 'dock' | 'wrap' | 'nowrap' | 'folder') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('width', '16')
  svg.setAttribute('height', '16')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '1.8')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  const path = document.createElementNS(svg.namespaceURI, 'path')
  const paths = {
    dock: 'M3 4h18v16H3z M15 4v16 M18 8h.01 M18 12h.01 M18 16h.01',
    settings: 'M10 2h4l.6 3 1.4.8 2.9-1 2 3.4-2.3 2v3.6l2.3 2-2 3.4-2.9-1-1.4.8-.6 3h-4l-.6-3-1.4-.8-2.9 1-2-3.4 2.3-2v-3.6l-2.3-2 2-3.4 2.9 1L9.4 5z',
    wrap: 'M3 5h18 M3 10h14a4 4 0 0 1 0 8h-4 m3-3-3 3 3 3 M3 16h5',
    nowrap: 'M3 5h18 M3 10h18 M3 16h14 m-3-3 3 3-3 3',
    folder: 'M3 6h6l2 2h10v11H3z',
  }
  path.setAttribute('d', paths[kind])
  svg.append(path)
  if (kind === 'settings') {
    const center = document.createElementNS(svg.namespaceURI, 'circle')
    center.setAttribute('cx', '12')
    center.setAttribute('cy', '12')
    center.setAttribute('r', '3')
    svg.append(center)
  }
  return svg
}

export function disclosureIcon(kind: CollapseIcon, expanded: boolean): HTMLElement | SVGElement | undefined {
  if (kind === 'none') return undefined

  if (kind === 'triangle' || kind === 'bullet') {
    const span = document.createElement('span')
    span.className = kind === 'triangle' ? 'outline-view__triangle' : 'outline-view__bullet'
    span.setAttribute('aria-hidden', 'true')
    if (kind === 'triangle') span.textContent = expanded ? '▾' : '▸'
    return span
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 20 20')
  svg.setAttribute('width', '16')
  svg.setAttribute('height', '16')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '1.35')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  svg.dataset.disclosureIcon = kind
  svg.dataset.expanded = String(expanded)

  const addPath = (d: string, fill = false) => {
    const path = document.createElementNS(svg.namespaceURI, 'path')
    path.setAttribute('d', d)
    if (fill) {
      path.setAttribute('fill', 'currentColor')
      path.setAttribute('fill-opacity', '.1')
    }
    svg.append(path)
  }

  if (kind === 'arrow') {
    addPath(expanded ? 'm6 8 4 4 4-4' : 'm8 6 4 4-4 4')
  } else if (expanded) {
    addPath('M2.5 15.5V5.2a1 1 0 0 1 1-1h4l2 2h6a1 1 0 0 1 1 1v2')
    addPath('M2.5 15.5 5 9.2h12.5l-2.5 6.3Z', true)
  } else {
    addPath('M2.5 15.5V5.2a1 1 0 0 1 1-1h4l2 2h7a1 1 0 0 1 1 1v8.3Z', true)
  }
  return svg
}
