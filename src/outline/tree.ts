import type {
  HeadingLevel,
  OutlineHeading,
  OutlineNode,
} from './model'

export function filterHeadings(
  headings: OutlineHeading[],
  minimum: HeadingLevel,
  maximum: HeadingLevel,
) {
  return headings.filter(
    ({ level }) => level >= minimum && level <= maximum,
  )
}

export function buildOutlineTree(headings: OutlineHeading[]): OutlineNode[] {
  const roots: OutlineNode[] = []
  const ancestors: OutlineNode[] = []

  for (const heading of headings) {
    while (
      ancestors.length > 0 &&
      ancestors[ancestors.length - 1].level >= heading.level
    ) {
      ancestors.pop()
    }

    const parent = ancestors.at(-1)
    const node: OutlineNode = {
      ...heading,
      parentKey: parent?.key,
      children: [],
    }

    if (parent) parent.children.push(node)
    else roots.push(node)

    ancestors.push(node)
  }

  return roots
}

export function flattenOutlineTree(nodes: OutlineNode[]): OutlineNode[] {
  const flattened: OutlineNode[] = []

  const visit = (node: OutlineNode) => {
    flattened.push(node)
    node.children.forEach(visit)
  }

  nodes.forEach(visit)
  return flattened
}

export function pathToOutlineNode(
  nodes: OutlineNode[],
  key: string,
  ancestors: OutlineNode[] = [],
): OutlineNode[] {
  for (const node of nodes) {
    const path = [...ancestors, node]
    if (node.key === key) return path
    const found = pathToOutlineNode(node.children, key, path)
    if (found.length > 0) return found
  }
  return []
}

function cloneOutlineSubtree(node: OutlineNode): OutlineNode {
  return { ...node, children: node.children.map(cloneOutlineSubtree) }
}

export function focusOutlineTree(nodes: OutlineNode[], key: string): OutlineNode[] {
  const path = pathToOutlineNode(nodes, key)
  if (path.length === 0) return nodes

  let branch = cloneOutlineSubtree(path[path.length - 1])
  for (let index = path.length - 2; index >= 0; index -= 1) {
    branch = { ...path[index], children: [branch] }
  }
  return [branch]
}
