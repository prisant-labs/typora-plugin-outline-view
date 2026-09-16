import type { OutlineHeading } from './model'

export function navigateToHeading(heading: OutlineHeading) {
  if (typeof heading.element.scrollIntoView === 'function') {
    heading.element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const editor = heading.element.closest<HTMLElement>('#write')
  if (editor && typeof editor.focus === 'function') {
    editor.focus({ preventScroll: true })
  }
}
