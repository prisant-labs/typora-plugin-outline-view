import type { HeadingLevel, OutlineHeading } from './model'

const HEADING_TAG = /^H([1-6])$/
const fallbackIdentityByEditor = new WeakMap<
  HTMLElement,
  { nextId: number; keys: WeakMap<HTMLElement, string> }
>()

function normalizeHeadingText(element: HTMLElement) {
  const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim()
  return text || 'Untitled heading'
}

export function parseHeadings(editor: HTMLElement | null): OutlineHeading[] {
  if (!editor) return []

  const headings: OutlineHeading[] = []
  let fallbackIdentity = fallbackIdentityByEditor.get(editor)
  if (!fallbackIdentity) {
    fallbackIdentity = { nextId: 0, keys: new WeakMap() }
    fallbackIdentityByEditor.set(editor, fallbackIdentity)
  }

  for (const child of Array.from(editor.children)) {
    if (!(child instanceof HTMLElement)) continue

    const match = child.tagName.match(HEADING_TAG)
    if (!match) continue

    const cid = child.getAttribute('cid')?.trim() || undefined
    let key = cid ? `cid:${cid}` : fallbackIdentity.keys.get(child)
    if (!key) {
      key = `heading:${fallbackIdentity.nextId}`
      fallbackIdentity.nextId += 1
      fallbackIdentity.keys.set(child, key)
    }

    headings.push({
      key,
      cid,
      level: Number(match[1]) as HeadingLevel,
      text: normalizeHeadingText(child),
      element: child,
    })
  }

  return headings
}
