/** Small DOM-native icons remain visible without the host's icon font. */
export function outlineIcon(kind: 'settings' | 'dock' | 'wrap' | 'nowrap') {
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
