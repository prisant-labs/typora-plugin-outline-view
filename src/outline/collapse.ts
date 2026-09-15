import type { HeadingLevel, OutlineNode } from './model'

export interface RememberedCollapseState {
  collapsedKeys: ReadonlySet<string>
  knownBranchKeys: ReadonlySet<string>
}

function branchKeys(nodes: OutlineNode[]) {
  const keys: string[] = []

  const visit = (node: OutlineNode) => {
    if (node.children.length === 0) return
    keys.push(node.key)
    node.children.forEach(visit)
  }

  nodes.forEach(visit)
  return keys
}

export function createCollapsedState(
  nodes: OutlineNode[],
  expandThroughLevel: HeadingLevel,
  remembered?: RememberedCollapseState,
) {
  const validBranches = branchKeys(nodes)
  const defaultCollapsed = new Set<string>()

  const collectDefaults = (node: OutlineNode) => {
    if (node.children.length === 0) return
    if (node.level >= expandThroughLevel) defaultCollapsed.add(node.key)
    node.children.forEach(collectDefaults)
  }
  nodes.forEach(collectDefaults)

  if (remembered) {
    return new Set(
      validBranches.filter((key) =>
        remembered.knownBranchKeys.has(key)
          ? remembered.collapsedKeys.has(key)
          : defaultCollapsed.has(key),
      ),
    )
  }

  return defaultCollapsed
}

export function toggleCollapsed(
  collapsed: ReadonlySet<string>,
  key: string,
) {
  const next = new Set(collapsed)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
}

export function expandAll() {
  return new Set<string>()
}

export function collapseAll(nodes: OutlineNode[]) {
  return new Set(branchKeys(nodes))
}

export function revealAncestors(
  nodes: OutlineNode[],
  collapsed: ReadonlySet<string>,
  activeKey: string,
) {
  const parents = new Map<string, string | undefined>()

  const visit = (node: OutlineNode) => {
    parents.set(node.key, node.parentKey)
    node.children.forEach(visit)
  }

  nodes.forEach(visit)
  if (!parents.has(activeKey)) return new Set(collapsed)

  const revealed = new Set(collapsed)
  let parentKey = parents.get(activeKey)
  while (parentKey) {
    revealed.delete(parentKey)
    parentKey = parents.get(parentKey)
  }
  return revealed
}
