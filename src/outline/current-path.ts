import type { OutlineNode } from './model'

export function createCurrentPath() {
  const path = document.createElement('nav')
  path.className = 'outline-view__current-path'
  path.setAttribute('aria-label', 'Current outline path')
  path.hidden = true
  return path
}

export function renderCurrentPath(
  container: HTMLElement,
  path: OutlineNode[],
  onNavigate: (node: OutlineNode) => void,
  visible: boolean,
) {
  container.replaceChildren()
  container.hidden = !visible || path.length === 0
  if (container.hidden) return

  path.forEach((node, index) => {
    if (index > 0) {
      const separator = document.createElement('span')
      separator.textContent = '›'
      separator.setAttribute('aria-hidden', 'true')
      container.append(separator)
    }
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = node.text
    button.title = node.text
    button.addEventListener('click', () => onNavigate(node))
    container.append(button)
  })
}
