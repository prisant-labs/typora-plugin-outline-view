import type { OutlineHeading, OutlineNode } from './model'
import { buildOutlineTree } from './tree'
import type { CollapseIcon, HeadingStyles } from '../settings/model'
import { applyHeadingAppearance } from './appearance'
import { disclosureIcon } from '../integration/icons'

export type NavigateHandler = (heading: OutlineHeading) => void

export interface RenderOutlineOptions {
  collapsedKeys: ReadonlySet<string>
  activeKey?: string
  emptyMessage?: string
  headingStyles?: HeadingStyles
  collapseIcon?: CollapseIcon
  activePathKeys?: ReadonlySet<string>
  onNavigate: NavigateHandler
  onToggle(node: OutlineNode): void
}

function createEmptyState(message: string) {
  const emptyState = document.createElement('p')
  emptyState.className = 'outline-view__empty'
  emptyState.setAttribute('role', 'status')
  emptyState.textContent = message
  return emptyState
}

function hasChildren(value: OutlineHeading | OutlineNode): value is OutlineNode {
  return 'children' in value
}

function renderNodes(
  nodes: OutlineNode[],
  options: RenderOutlineOptions,
  role: 'tree' | 'group',
  depth: number,
  visibleIndex: { value: number },
  visible: boolean,
) {
  const list = document.createElement('ul')
  list.className =
    role === 'tree' ? 'outline-view__tree' : 'outline-view__group'
  list.setAttribute('role', role)
  if (role === 'tree') list.setAttribute('aria-label', 'Document headings')

  for (const node of nodes) {
    const listItem = document.createElement('li')
    listItem.className = 'outline-view__node'
    listItem.setAttribute('role', 'none')

    const row = document.createElement('div')
    row.className = 'outline-view__row'
    if (visible) {
      row.classList.add(visibleIndex.value % 2 === 0 ? 'is-zebra-a' : 'is-zebra-b')
      visibleIndex.value += 1
    }
    if (options.activePathKeys?.has(node.key) && node.key !== options.activeKey) {
      row.classList.add('is-active-path')
    }

    if (node.children.length > 0) {
      const collapsed = options.collapsedKeys.has(node.key)
      const disclosure = document.createElement('button')
      disclosure.className = 'outline-view__disclosure'
      disclosure.type = 'button'
      disclosure.dataset.branchKey = node.key
      disclosure.setAttribute('aria-expanded', String(!collapsed))
      disclosure.setAttribute(
        'aria-label',
        `${collapsed ? 'Expand' : 'Collapse'} ${node.text}`,
      )
      const icon = disclosureIcon(options.collapseIcon ?? 'triangle', !collapsed)
      if (icon) disclosure.append(icon)
      disclosure.addEventListener('click', () => options.onToggle(node))
      row.append(disclosure)
    } else {
      const spacer = document.createElement('span')
      spacer.className = 'outline-view__disclosure-spacer'
      spacer.setAttribute('aria-hidden', 'true')
      row.append(spacer)
    }

    const button = document.createElement('button')
    button.className = 'outline-view__item'
    button.type = 'button'
    button.dataset.headingKey = node.key
    button.dataset.headingLevel = String(node.level)
    button.setAttribute('role', 'treeitem')
    button.setAttribute('aria-level', String(depth))
    button.title = node.text
    button.textContent = node.text
    if (options.headingStyles) applyHeadingAppearance(row, button, options.headingStyles[node.level])
    if (node.children.length > 0) {
      button.setAttribute(
        'aria-expanded',
        String(!options.collapsedKeys.has(node.key)),
      )
    }
    if (node.key === options.activeKey) {
      button.classList.add('is-active')
      button.setAttribute('aria-current', 'location')
    }
    button.addEventListener('click', () => options.onNavigate(node))
    row.append(button)
    listItem.append(row)

    if (node.children.length > 0) {
      const collapsed = options.collapsedKeys.has(node.key)
      const group = renderNodes(node.children, options, 'group', depth + 1, visibleIndex, visible && !collapsed)
      group.hidden = collapsed
      listItem.append(group)
    }

    list.append(listItem)
  }

  return list
}

export function renderOutline(
  container: HTMLElement,
  headings: Array<OutlineHeading | OutlineNode>,
  optionsOrNavigate: RenderOutlineOptions | NavigateHandler,
) {
  const options: RenderOutlineOptions =
    typeof optionsOrNavigate === 'function'
      ? {
          collapsedKeys: new Set(),
          onNavigate: optionsOrNavigate,
          onToggle: () => undefined,
        }
      : optionsOrNavigate

  if (headings.length === 0) {
    container.replaceChildren(
      createEmptyState(
        options.emptyMessage ?? 'No headings in this document.',
      ),
    )
    return
  }

  const nodes = headings.every(hasChildren)
    ? headings
    : buildOutlineTree(headings as OutlineHeading[])
  container.replaceChildren(renderNodes(nodes, options, 'tree', 1, { value: 0 }, true))
}
