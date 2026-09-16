import { afterEach, describe, expect, it, vi } from 'vitest'
import { HeadingRangeSelector } from './range-selector'
import { normalizeOutlineSettings } from '../settings/model'

const controls: HeadingRangeSelector[] = []
function create(start = 1, end = 6) {
  const change = vi.fn()
  const control = new HeadingRangeSelector(change)
  controls.push(control)
  control.update({ start, end } as never, normalizeOutlineSettings())
  document.body.append(control.element)
  control.track.getBoundingClientRect = () => ({ left: 0, width: 300 }) as DOMRect
  const handle = (name: string) => control.element.querySelector<HTMLButtonElement>(`[data-handle="${name}"]`)!
  const stop = (level: number) => control.element.querySelector<HTMLButtonElement>(`[data-level="${level}"]`)!
  return { control, change, handle, stop }
}
function pointer(target: EventTarget, type: string, x: number) {
  const event = new MouseEvent(type, { bubbles: true, clientX: x, button: 0 })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  target.dispatchEvent(event)
}
afterEach(() => { controls.splice(0).forEach(c => c.destroy()); document.body.replaceChildren() })

describe('heading range selector', () => {
  it('ends a gesture without leaking subsequent moves into a new document', () => {
    const { control, change, handle } = create(1, 6)
    pointer(handle('end'), 'pointerdown', 275)
    pointer(document, 'pointermove', 175)
    control.endGesture()
    control.update({ start: 2, end: 5 }, normalizeOutlineSettings())
    const count = change.mock.calls.length
    pointer(document, 'pointermove', 75)
    expect(control.value).toEqual({ start: 2, end: 5 })
    expect(change).toHaveBeenCalledTimes(count)
  })
  it('moves a clicked endpoint, permits equality, and clamps instead of crossing', () => {
    const { control, handle, stop } = create(1, 4)
    handle('start').click()
    stop(2).click()
    expect(control.value).toEqual({ start: 2, end: 4 })
    stop(6).click()
    expect(control.value).toEqual({ start: 4, end: 4 })
    handle('end').click()
    stop(1).click()
    expect(control.value).toEqual({ start: 4, end: 4 })
  })

  it('keeps both endpoints keyboard reachable at equality and supports bounded arrow/Home/End', () => {
    const { control, handle } = create(3, 3)
    expect(handle('start').tabIndex).toBe(0)
    expect(handle('end').tabIndex).toBe(0)
    handle('start').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(control.value).toEqual({ start: 3, end: 3 })
    handle('end').dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    expect(control.value).toEqual({ start: 3, end: 6 })
    handle('start').dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    expect(control.value).toEqual({ start: 1, end: 6 })
    expect(handle('start').getAttribute('aria-valuemax')).toBe('6')
  })

  it('drags either endpoint directly, snaps to levels, and stops at the other endpoint', () => {
    const { control, handle } = create(1, 4)
    pointer(handle('start'), 'pointerdown', 25)
    pointer(document, 'pointermove', 75)
    expect(control.value).toEqual({ start: 2, end: 4 })
    pointer(document, 'pointermove', 275)
    expect(control.value).toEqual({ start: 4, end: 4 })
    pointer(document, 'pointerup', 275)
  })

  it.each([['left', 75, { start: 2, end: 3 }], ['right', 225, { start: 3, end: 5 }]] as const)(
    'splits a shared handle when dragging %s', (_direction, x, expected) => {
      const { control, handle } = create(3, 3)
      pointer(handle('end'), 'pointerdown', 125)
      pointer(document, 'pointermove', x)
      pointer(document, 'pointerup', x)
      expect(control.value).toEqual(expected)
    },
  )

  it('restores the prior range on pointer cancellation and releases document handlers', () => {
    const { control, change, handle } = create(1, 6)
    pointer(handle('end'), 'pointerdown', 275)
    pointer(document, 'pointermove', 175)
    pointer(document, 'pointercancel', 175)
    expect(control.value).toEqual({ start: 1, end: 6 })
    pointer(handle('start'), 'pointerdown', 25)
    control.destroy()
    const calls = change.mock.calls.length
    pointer(document, 'pointermove', 125)
    expect(change).toHaveBeenCalledTimes(calls)
  })

  it.each(['escape', 'blur', 'lostcapture'])('restores the range on %s and ignores subsequent movement', reason => {
    const { control, handle } = create(1, 6)
    pointer(handle('end'), 'pointerdown', 275)
    pointer(document, 'pointermove', 175)
    if (reason === 'escape') handle('end').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    else if (reason === 'blur') window.dispatchEvent(new Event('blur'))
    else pointer(handle('end'), 'lostpointercapture', 175)
    expect(control.value).toEqual({ start: 1, end: 6 })
    pointer(document, 'pointermove', 75)
    expect(control.value).toEqual({ start: 1, end: 6 })
  })

  it('switches the selected endpoint with pointer clicks at equality', () => {
    const { control, handle, stop } = create(3, 3)
    pointer(handle('end'), 'pointerdown', 125)
    pointer(document, 'pointerup', 125)
    handle('end').click()
    expect(control.element.dataset.activeEndpoint).toBe('start')
    stop(2).click()
    expect(control.value).toEqual({ start: 2, end: 3 })
  })

  it('updates visibility and all display choices without rebuilding endpoint DOM', () => {
    const { control, handle } = create()
    const start = handle('start')
    for (const style of ['rail', 'enclosure', 'bracket'] as const) {
      control.update({ start: 2, end: 5 }, normalizeOutlineSettings({ selectorStyle: style, selectorLabels: false, selectorColor: 'grayscale' }))
      expect(control.element.dataset.style).toBe(style)
      expect(control.element.dataset.labels).toBe('false')
      expect(control.element.dataset.color).toBe('grayscale')
      expect(handle('start')).toBe(start)
    }
    control.update(control.value, normalizeOutlineSettings({ showLevelSelector: false }))
    expect(control.element.hidden).toBe(true)
  })
})
