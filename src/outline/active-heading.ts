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

function nearestScrollableAncestor(editor: HTMLElement) {
  let candidate: HTMLElement | null = editor.parentElement

  while (candidate) {
    if (candidate.scrollHeight > candidate.clientHeight) return candidate
    candidate = candidate.parentElement
  }

  return document.scrollingElement
}

export function isEditorAtBottom(editor: HTMLElement) {
  const scroller = nearestScrollableAncestor(editor)
  if (!scroller || scroller.scrollHeight <= scroller.clientHeight) return false

  return (
    scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1
  )
}
