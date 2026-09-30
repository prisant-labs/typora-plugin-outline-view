import type { OutlineHeading } from './model'
import { editorScroller, getEditorViewportTop } from './active-heading'

// Typora can replace a heading element but keep its cid, for example when it
// shows the focused heading as source. Follow the cid to the live element.
function liveHeadingElement(heading: OutlineHeading) {
  if (heading.element.isConnected || !heading.cid) return heading.element
  const editor = heading.element.ownerDocument.querySelector('#write')
  const replacement = Array.from(editor?.children ?? []).find(
    (child) => child.getAttribute('cid') === heading.cid,
  )
  return replacement instanceof HTMLElement ? replacement : heading.element
}

export function navigateToHeading(heading: OutlineHeading) {
  const element = liveHeadingElement(heading)
  const editor = element.closest<HTMLElement>('#write')
  if (!editor) return

  // Focus before scrolling. On macOS, focusing the editor can scroll back to
  // the caret despite preventScroll, which cancelled the earlier smooth scroll.
  // Typora saves and restores its own scroll position around focus for this.
  if (
    !editor.contains(editor.ownerDocument.activeElement) &&
    typeof editor.focus === 'function'
  ) {
    editor.focus({ preventScroll: true })
  }

  // Scroll only the editor viewport, and instantly: nothing can interrupt it,
  // and host ancestors such as the dock stay where they are.
  const scroller = editorScroller(editor)
  scroller.scrollTop +=
    element.getBoundingClientRect().top - getEditorViewportTop(editor)
}
