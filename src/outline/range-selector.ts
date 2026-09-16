import type { HeadingLevel } from './model'
import { HEADING_LEVEL_OPTIONS, type OutlineSettings } from '../settings/model'

export interface HeadingRange { start: HeadingLevel; end: HeadingLevel }
type Endpoint = 'start' | 'end'
type DisplaySettings = Pick<OutlineSettings, 'showLevelSelector' | 'selectorStyle' | 'selectorLabels' | 'selectorColor'>

/** Shared by the workspace and settings preview. No document mutation. */
export class HeadingRangeSelector {
  readonly element = document.createElement('div')
  readonly track = document.createElement('div')
  private readonly status = document.createElement('span')
  private readonly handles = {} as Record<Endpoint, HTMLButtonElement>
  private readonly stops: HTMLButtonElement[] = []
  private range: HeadingRange = { start: 1, end: 6 }
  private active: Endpoint = 'end'
  private drag?: { id: number; x: number; range: HeadingRange; endpoint: Endpoint; merged: boolean; moved: boolean; capture: HTMLButtonElement }
  private suppressClick = false
  private suppressTimer?: ReturnType<typeof setTimeout>
  private destroyed = false

  constructor(private readonly onChange: (range: HeadingRange) => void) {
    this.element.className = 'outline-view__level-selector'
    this.element.setAttribute('role', 'group')
    this.element.setAttribute('aria-label', 'Visible heading range')
    this.track.className = 'outline-view__level-track'
    for (const name of ['base', 'active', 'shape']) {
      const decoration = document.createElement('span')
      decoration.className = `outline-view__range-${name}`
      decoration.setAttribute('aria-hidden', 'true')
      this.track.append(decoration)
    }
    for (const level of HEADING_LEVEL_OPTIONS) {
      const stop = document.createElement('button')
      stop.type = 'button'
      stop.className = 'outline-view__level-stop'
      stop.dataset.level = String(level)
      stop.tabIndex = -1
      const mark = document.createElement('span')
      mark.className = 'outline-view__level-mark'
      mark.setAttribute('aria-hidden', 'true')
      const label = document.createElement('span')
      label.className = 'outline-view__level-label'
      label.textContent = `H${level}`
      stop.append(mark, label)
      this.stops.push(stop)
      this.track.append(stop)
    }
    for (const endpoint of ['start', 'end'] as const) {
      const handle = document.createElement('button')
      handle.type = 'button'
      handle.className = 'outline-view__range-handle'
      handle.dataset.handle = endpoint
      handle.setAttribute('role', 'slider')
      handle.setAttribute('aria-label', `${endpoint === 'start' ? 'Start' : 'End'} heading level`)
      handle.setAttribute('aria-orientation', 'horizontal')
      handle.tabIndex = 0
      this.handles[endpoint] = handle
      this.track.append(handle)
    }
    this.status.className = 'outline-view__range-status'
    this.status.setAttribute('aria-live', 'polite')
    this.element.append(this.track, this.status)
    this.element.addEventListener('click', this.onClick)
    this.element.addEventListener('keydown', this.onKeydown)
    this.element.addEventListener('pointerdown', this.onPointerDown)
    this.element.addEventListener('lostpointercapture', this.onPointerCancel)
    this.element.addEventListener('focusin', this.onFocus)
  }

  get value(): HeadingRange { return { ...this.range } }

  /** Commit the last position and release a gesture before switching contexts. */
  endGesture() { this.finishDrag(false) }

  update(range: HeadingRange, settings: DisplaySettings) {
    if (this.destroyed) return
    this.range = { ...range }
    this.element.hidden = !settings.showLevelSelector
    this.element.dataset.style = settings.selectorStyle
    this.element.dataset.labels = String(settings.selectorLabels)
    this.element.dataset.color = settings.selectorColor
    if (this.element.hidden) this.endGesture()
    this.sync()
  }

  private sync() {
    const { start, end } = this.range
    this.element.dataset.start = String(start)
    this.element.dataset.end = String(end)
    this.element.dataset.activeEndpoint = this.active
    this.element.dataset.merged = String(start === end)
    this.track.style.setProperty('--range-start', `${(start - .5) / 6 * 100}%`)
    this.track.style.setProperty('--range-end', `${(6.5 - end) / 6 * 100}%`)
    this.track.style.setProperty('--range-left', `${(start - 1) / 6 * 100}%`)
    this.track.style.setProperty('--range-right', `${(6 - end) / 6 * 100}%`)
    for (const stop of this.stops) {
      const level = Number(stop.dataset.level)
      stop.dataset.included = String(level >= start && level <= end)
      stop.classList.toggle('is-start', level === start)
      stop.classList.toggle('is-end', level === end)
      stop.title = `Move ${this.active} to H${level}`
      stop.setAttribute('aria-label', stop.title)
    }
    for (const endpoint of ['start', 'end'] as const) {
      const handle = this.handles[endpoint]
      handle.style.left = `${(this.range[endpoint] - 1) / 6 * 100}%`
      handle.setAttribute('aria-valuemin', String(endpoint === 'start' ? 1 : start))
      handle.setAttribute('aria-valuemax', String(endpoint === 'start' ? end : 6))
      handle.setAttribute('aria-valuenow', String(this.range[endpoint]))
      handle.setAttribute('aria-valuetext', `H${this.range[endpoint]}`)
      handle.title = start === end
        ? `H${start} only. Drag left to move start, right to move end. Click to switch endpoint.`
        : `${endpoint === 'start' ? 'Start' : 'End'}: H${this.range[endpoint]}. Drag, or click then choose a level.`
      handle.classList.toggle('is-armed', this.active === endpoint)
    }
    this.status.textContent = `${this.active === 'start' ? 'Start' : 'End'}: H${this.range[this.active]}. Showing H${start}–H${end}.`
  }

  private move(endpoint: Endpoint, level: number) {
    const next = endpoint === 'start'
      ? Math.max(1, Math.min(this.range.end, level))
      : Math.max(this.range.start, Math.min(6, level))
    this.active = endpoint
    if (this.range[endpoint] === next) { this.sync(); return }
    this.range = { ...this.range, [endpoint]: next }
    this.sync()
    this.onChange(this.value)
  }

  private onClick = (event: MouseEvent) => {
    if (this.suppressClick) return
    const target = (event.target as Element).closest<HTMLElement>('[data-handle], [data-level]')
    if (!target) return
    const endpoint = target.dataset.handle as Endpoint | undefined
    if (endpoint) {
      this.active = this.range.start === this.range.end
        ? (this.active === 'start' ? 'end' : 'start') : endpoint
      this.sync()
    } else this.move(this.active, Number(target.dataset.level))
  }

  private onFocus = (event: FocusEvent) => {
    const endpoint = (event.target as HTMLElement).dataset.handle as Endpoint | undefined
    if (endpoint) { this.active = endpoint; this.sync() }
  }

  private onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') { this.finishDrag(true); return }
    const endpoint = (event.target as HTMLElement).dataset.handle as Endpoint | undefined
    if (!endpoint) return
    let level = this.range[endpoint]
    if (event.key === 'Home') level = 1
    else if (event.key === 'End') level = 6
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') level = (level - 1) as HeadingLevel
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') level = (level + 1) as HeadingLevel
    else return
    event.preventDefault()
    this.move(endpoint, level)
  }

  private onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || this.drag) return
    const endpoint = (event.target as Element).closest<HTMLElement>('[data-handle]')?.dataset.handle as Endpoint | undefined
    if (!endpoint) return
    const capture = this.handles[endpoint]
    this.drag = { id: event.pointerId, x: event.clientX, range: this.value, endpoint, merged: this.range.start === this.range.end, moved: false, capture }
    capture.setPointerCapture?.(event.pointerId)
    // Only document listeners for an active gesture; removed on release/cancel/unload.
    document.addEventListener('pointermove', this.onPointerMove)
    document.addEventListener('pointerup', this.onPointerUp)
    document.addEventListener('pointercancel', this.onPointerCancel)
    window.addEventListener('blur', this.onBlur)
    event.preventDefault()
    this.handles[this.drag.merged ? this.active : endpoint].focus()
  }

  private onPointerMove = (event: PointerEvent) => {
    const drag = this.drag
    if (!drag || event.pointerId !== drag.id) return
    const delta = event.clientX - drag.x
    if (!drag.moved && Math.abs(delta) < 4) return
    if (drag.merged && !drag.moved) drag.endpoint = delta < 0 ? 'start' : 'end'
    drag.moved = true
    const bounds = this.track.getBoundingClientRect()
    if (bounds.width <= 0) return
    this.move(drag.endpoint, Math.round((event.clientX - bounds.left) / bounds.width * 6 + .5))
  }

  private onPointerUp = (event: PointerEvent) => {
    if (event.pointerId === this.drag?.id) this.finishDrag(false)
  }
  private onPointerCancel = (event: PointerEvent) => {
    if (event.pointerId === this.drag?.id) this.finishDrag(true)
  }
  private onBlur = () => this.finishDrag(true)

  private finishDrag(cancel: boolean) {
    const drag = this.drag
    this.drag = undefined
    document.removeEventListener('pointermove', this.onPointerMove)
    document.removeEventListener('pointerup', this.onPointerUp)
    document.removeEventListener('pointercancel', this.onPointerCancel)
    window.removeEventListener('blur', this.onBlur)
    if (!drag) return
    if (drag.capture.hasPointerCapture?.(drag.id)) drag.capture.releasePointerCapture(drag.id)
    if (drag.moved) {
      this.suppressClick = true
      clearTimeout(this.suppressTimer)
      this.suppressTimer = setTimeout(() => { this.suppressClick = false }, 0)
    }
    if (cancel && (this.range.start !== drag.range.start || this.range.end !== drag.range.end)) {
      this.range = drag.range
      this.sync()
      this.onChange(this.value)
    }
  }

  destroy() {
    this.finishDrag(false)
    clearTimeout(this.suppressTimer)
    this.element.removeEventListener('click', this.onClick)
    this.element.removeEventListener('keydown', this.onKeydown)
    this.element.removeEventListener('pointerdown', this.onPointerDown)
    this.element.removeEventListener('lostpointercapture', this.onPointerCancel)
    this.element.removeEventListener('focusin', this.onFocus)
    this.destroyed = true
  }
}
