import type { OutlineHeading } from './model'

export interface ActiveHeadingOptions {
  thresholdTop: number
  atDocumentEnd?: boolean
}

export function selectActiveHeading(
  headings: OutlineHeading[],
  options: ActiveHeadingOptions,
) {
  if (headings.length === 0) return undefined
  if (options.atDocumentEnd) return headings.at(-1)

  let active = headings[0]
  for (const heading of headings) {
    if (heading.element.getBoundingClientRect().top > options.thresholdTop) {
      break
    }
    active = heading
  }
  return active
}

function editorScroller(editor: HTMLElement) {
  const doc = editor.ownerDocument
  const root = doc.scrollingElement ?? doc.documentElement
  let candidate: HTMLElement | null = editor

  while (candidate && candidate !== root) {
    // Overflowing content alone does not make a wrapper a scroll viewport.
    const overflowY = getComputedStyle(candidate).overflowY
    if (
      candidate.clientHeight > 0 &&
      candidate.scrollHeight > candidate.clientHeight &&
      /^(auto|scroll|overlay)$/.test(overflowY)
    ) return candidate
    candidate = candidate.parentElement
  }

  return root
}

export function getEditorViewportTop(editor: HTMLElement) {
  const scroller = editorScroller(editor)
  const doc = editor.ownerDocument
  // Root scrolling uses the browser viewport; the document rect itself moves.
  if (scroller === (doc.scrollingElement ?? doc.documentElement)) return 0
  return Math.max(0, scroller.getBoundingClientRect().top + scroller.clientTop)
}

export function isEditorAtBottom(editor: HTMLElement) {
  const scroller = editorScroller(editor)
  if (!scroller || scroller.scrollHeight <= scroller.clientHeight) return false

  return (
    scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1
  )
}
