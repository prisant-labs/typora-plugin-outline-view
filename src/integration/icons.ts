/** Small DOM-native icons remain visible without the host's icon font. */
export function outlineIcon(kind: 'settings' | 'dock') {
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
  path.setAttribute('d', kind === 'dock'
    ? 'M3 4h18v16H3z M15 4v16 M18 8h.01 M18 12h.01 M18 16h.01'
    : 'M4 7h16 M4 17h16 M8 4v6 M16 14v6')
  svg.append(path)
  return svg
}
