import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@typora-community-plugin/core', () => ({
  WorkspaceView: class {
    private disposables: Array<() => void> = []

    constructor(public leaf: unknown) {}

    register(disposable: () => void) {
      this.disposables.push(disposable)
    }

    unload() {
      this.disposables.forEach((dispose) => dispose())
      this.disposables = []
    }
  },
}))

import type { OutlineSettings } from '../settings/model'
import { DEFAULT_OUTLINE_SETTINGS } from '../settings/model'
import { OutlineView } from './outline-view'

type Listener = (...args: unknown[]) => void

class FakeEventBus {
  private listeners = new Map<string, Set<Listener>>()

  on(event: string, listener: Listener) {
    const listeners = this.listeners.get(event) ?? new Set<Listener>()
    listeners.add(listener)
    this.listeners.set(event, listeners)
    return () => listeners.delete(listener)
  }

  emit(event: string, ...args: unknown[]) {
    this.listeners.get(event)?.forEach((listener) => listener(...args))
  }

  count(event: string) {
    return this.listeners.get(event)?.size ?? 0
  }
}

class FakeSettings {
  private values: OutlineSettings = { ...DEFAULT_OUTLINE_SETTINGS }
  private listeners = new Set<Listener>()

  get<K extends keyof OutlineSettings>(key: K) {
    return this.values[key]
  }

  set<K extends keyof OutlineSettings>(key: K, value: OutlineSettings[K]) {
    this.values[key] = value
    this.listeners.forEach((listener) => listener(key, value))
  }

  onChange(key: '*', listener: Listener) {
    expect(key).toBe('*')
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  listenerCount() {
    return this.listeners.size
  }
}

function createApp(activeFile = 'doc.md') {
  const workspace = Object.assign(new FakeEventBus(), { activeFile })
  const markdownEditor = new FakeEventBus()

  return {
    app: {
      workspace,
      features: { markdownEditor },
    },
    markdownEditor,
    workspace,
  }
}

function setHeadingTops(tops: number[]) {
  Array.from(document.querySelectorAll<HTMLElement>('#write > h1, #write > h2, #write > h3, #write > h4, #write > h5, #write > h6')).forEach(
    (heading, index) => {
      const top = tops[index] ?? 1000 + index * 100
      heading.getBoundingClientRect = () => ({ top }) as DOMRect
    },
  )
}

function labels(view: OutlineView) {
  return Array.from(
    view.containerEl.querySelectorAll('.outline-view__item'),
  ).map((button) => button.textContent)
}

function levelStops(view: OutlineView) {
  return Array.from(
    view.containerEl.querySelectorAll<HTMLButtonElement>(
      '.outline-view__level-stop',
    ),
  )
}

function selectedLevel(view: OutlineView) {
  return levelStops(view).find(
    (button) => button.getAttribute('aria-checked') === 'true',
  )?.dataset.level
}

afterEach(() => {
  document.body.replaceChildren()
  vi.useRealTimers()
  delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView
})

describe('OutlineView', () => {
  it('renders the default nested hierarchy without a duplicate title', () => {
    document.body.innerHTML =
      '<div id="write"><h1 cid="one">One</h1><h2 cid="two">Two</h2><h3 cid="three">Three</h3><h4 cid="four">Four</h4></div>'
    setHeadingTops([10, 120, 240, 360])
    const { app } = createApp()
    const settings = new FakeSettings()
    const view = new OutlineView({} as never, app as never, settings as never)

    view.onOpen()

    expect(view.containerEl.querySelector('.outline-view__header')).toBeNull()
    expect(view.containerEl.querySelector('[role="toolbar"]')).not.toBeNull()
    const toolbar = view.containerEl.querySelector('[role="toolbar"]')!
    expect(
      Array.from(toolbar.querySelectorAll<HTMLButtonElement>('button')).map(
        ({ dataset }) => dataset.action,
      ),
    ).toEqual(['collapse-all', 'expand-all', 'open-settings'])
    expect(
      Array.from(toolbar.querySelectorAll<HTMLButtonElement>('button')).map(
        ({ textContent }) => textContent?.trim(),
      ),
    ).toEqual(['Collapse all', 'Expand all', ''])
    expect(
      toolbar
        .querySelector('[data-action="open-settings"]')
        ?.getAttribute('aria-label'),
    ).toBe('Configure Outline View')
    expect(toolbar.querySelector('.outline-view__toolbar-spacer')).not.toBeNull()
    expect(labels(view)).toEqual(['One', 'Two', 'Three', 'Four'])
    expect(
      view.containerEl.querySelector('[data-branch-key="cid:three"]')?.getAttribute(
        'aria-expanded',
      ),
    ).toBe('false')
    expect(view.containerEl.classList.contains('outline-view--comfortable')).toBe(
      true,
    )
    expect(view.containerEl.classList.contains('outline-view--indent-medium')).toBe(
      true,
    )
    expect(view.containerEl.classList.contains('outline-view--wrap')).toBe(true)
  })

  it('renders an accessible six-stop heading-level selector below the toolbar', () => {
    document.body.innerHTML =
      '<div id="write"><h1>One</h1><h2>Two</h2><h3>Three</h3><h4>Four</h4><h5>Five</h5><h6>Six</h6></div>'
    setHeadingTops([10, 110, 210, 310, 410, 510])
    const { app } = createApp()
    const view = new OutlineView({} as never, app as never)

    view.onOpen()

    const toolbar = view.containerEl.querySelector('.outline-view__toolbar')
    const selector = view.containerEl.querySelector(
      '[role="radiogroup"][aria-label="Maximum visible heading level"]',
    )
    const stops = levelStops(view)

    expect(toolbar?.nextElementSibling).toBe(selector)
    expect(stops).toHaveLength(6)
    expect(stops.map(({ dataset }) => dataset.level)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ])
    expect(stops.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Show through H1',
      'Show through H2',
      'Show through H3',
      'Show through H4',
      'Show through H5',
      'Show through H6',
    ])
    expect(selectedLevel(view)).toBe('6')
    expect(stops.map(({ tabIndex }) => tabIndex)).toEqual([-1, -1, -1, -1, -1, 0])
    expect(
      view.containerEl.querySelector('.outline-view__level-value')?.textContent,
    ).toBe('Through H6')
  })

  it('filters the active document immediately when a level stop is selected', () => {
    document.body.innerHTML =
      '<div id="write"><h1>One</h1><h2>Two</h2><h3>Three</h3><h4>Four</h4><h5>Five</h5><h6>Six</h6></div>'
    setHeadingTops([10, 110, 210, 310, 410, 510])
    const { app } = createApp()
    const view = new OutlineView({} as never, app as never)
    view.onOpen()

    levelStops(view)[2].click()

    expect(labels(view)).toEqual(['One', 'Two', 'Three'])
    expect(selectedLevel(view)).toBe('3')
    expect(
      view.containerEl.querySelector('.outline-view__level-value')?.textContent,
    ).toBe('Through H3')
  })

  it('supports arrow, Home, and End keys across enabled level stops', () => {
    document.body.innerHTML =
      '<div id="write"><h1>One</h1><h2>Two</h2><h3>Three</h3><h4>Four</h4><h5>Five</h5><h6>Six</h6></div>'
    setHeadingTops([10, 110, 210, 310, 410, 510])
    const { app } = createApp()
    const view = new OutlineView({} as never, app as never)
    view.onOpen()

    levelStops(view)[5].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    )
    expect(selectedLevel(view)).toBe('5')

    levelStops(view)[4].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
    )
    expect(selectedLevel(view)).toBe('1')

    levelStops(view)[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    )
    expect(selectedLevel(view)).toBe('6')
  })

  it('remembers independent maximum levels for documents during the session', () => {
    vi.useFakeTimers()
    document.body.innerHTML =
      '<div id="write"><h1>One</h1><h2>Two</h2><h3>Three</h3><h4>Four</h4><h5>Five</h5><h6>Six</h6></div>'
    setHeadingTops([10, 110, 210, 310, 410, 510])
    const { app, workspace } = createApp('doc.md')
    const view = new OutlineView({} as never, app as never)
    view.onOpen()

    levelStops(view)[2].click()
    workspace.activeFile = 'second.md'
    workspace.emit('file:open')
    vi.advanceTimersByTime(120)
    expect(selectedLevel(view)).toBe('6')

    levelStops(view)[4].click()
    workspace.activeFile = 'doc.md'
    workspace.emit('file:open')
    vi.advanceTimersByTime(120)

    expect(selectedLevel(view)).toBe('3')
    expect(labels(view)).toEqual(['One', 'Two', 'Three'])
  })

  it('clamps document selection and disables stops below the minimum level', () => {
    vi.useFakeTimers()
    document.body.innerHTML =
      '<div id="write"><h1>One</h1><h2>Two</h2><h3>Three</h3><h4>Four</h4><h5>Five</h5><h6>Six</h6></div>'
    setHeadingTops([10, 110, 210, 310, 410, 510])
    const { app } = createApp()
    const settings = new FakeSettings()
    const view = new OutlineView({} as never, app as never, settings as never)
    view.onOpen()
    levelStops(view)[1].click()

    settings.set('minHeadingLevel', 4)
    vi.advanceTimersByTime(120)

    const stops = levelStops(view)
    expect(selectedLevel(view)).toBe('4')
    expect(stops.slice(0, 3).every(({ disabled }) => disabled)).toBe(true)
    expect(stops.slice(3).every(({ disabled }) => !disabled)).toBe(true)
    expect(labels(view)).toEqual(['Four'])
    stops[1].click()
    expect(selectedLevel(view)).toBe('4')
  })

  it('preserves collapse choices for branches temporarily hidden by the selector', () => {
    document.body.innerHTML =
      '<div id="write"><h1 cid="root">Root</h1><h2 cid="section">Section</h2><h3 cid="topic">Topic</h3><h4 cid="deep">Deep branch</h4><h5 cid="leaf">Leaf</h5></div>'
    setHeadingTops([10, 110, 210, 310, 410])
    const { app } = createApp()
    const view = new OutlineView({} as never, app as never)
    view.onOpen()
    view.expandAll()

    expect(
      view.containerEl
        .querySelector('[data-branch-key="cid:deep"]')
        ?.getAttribute('aria-expanded'),
    ).toBe('true')

    levelStops(view)[2].click()
    view.collapseAll()
    view.expandAll()
    levelStops(view)[5].click()

    expect(
      view.containerEl
        .querySelector('[data-branch-key="cid:deep"]')
        ?.getAttribute('aria-expanded'),
    ).toBe('true')

    view.containerEl
      .querySelector<HTMLButtonElement>('[data-branch-key="cid:deep"]')
      ?.click()
    levelStops(view)[2].click()
    view.expandAll()
    view.collapseAll()
    levelStops(view)[5].click()

    expect(
      view.containerEl
        .querySelector('[data-branch-key="cid:deep"]')
        ?.getAttribute('aria-expanded'),
    ).toBe('false')
  })

  it('shows an unavailable state when no Markdown editor exists', () => {
    const { app } = createApp()
    const view = new OutlineView({} as never, app as never)

    view.onOpen()

    expect(view.containerEl.querySelector('[role="status"]')?.textContent).toBe(
      'Open a Markdown document to see its outline.',
    )
  })

  it('debounces editor changes and releases every listener on unload', () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div id="write"><h1>One</h1></div>'
    setHeadingTops([10])
    const { app, markdownEditor, workspace } = createApp()
    const settings = new FakeSettings()
    const view = new OutlineView({} as never, app as never, settings as never)
    const refresh = vi.spyOn(view, 'refresh')

    view.onOpen()
    markdownEditor.emit('edit')
    markdownEditor.emit('edit')
    vi.advanceTimersByTime(119)

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(markdownEditor.count('edit')).toBe(1)
    expect(markdownEditor.count('load')).toBe(1)
    expect(markdownEditor.count('scroll')).toBe(1)
    expect(workspace.count('file:open')).toBe(1)
    expect(settings.listenerCount()).toBe(1)

    vi.advanceTimersByTime(1)
    expect(refresh).toHaveBeenCalledTimes(2)

    ;(view as unknown as { unload(): void }).unload()
    markdownEditor.emit('edit')
    markdownEditor.emit('scroll')
    vi.runAllTimers()

    expect(refresh).toHaveBeenCalledTimes(2)
    expect(markdownEditor.count('edit')).toBe(0)
    expect(markdownEditor.count('load')).toBe(0)
    expect(markdownEditor.count('scroll')).toBe(0)
    expect(workspace.count('file:open')).toBe(0)
    expect(settings.listenerCount()).toBe(0)
  })

  it('connects rendered items to live heading navigation', () => {
    document.body.innerHTML = '<div id="write"><h1>One</h1></div>'
    setHeadingTops([10])
    const heading = document.querySelector('h1')!
    const scrollIntoView = vi.fn()
    heading.scrollIntoView = scrollIntoView
    const { app } = createApp()
    const view = new OutlineView({} as never, app as never)

    view.onOpen()
    view.containerEl
      .querySelector<HTMLButtonElement>('.outline-view__item')
      ?.click()

    expect(scrollIntoView).toHaveBeenCalledOnce()
  })

  it('supports toolbar and command-driven expand/collapse all', () => {
    document.body.innerHTML =
      '<div id="write"><h1>One</h1><h2>Two</h2><h3>Three</h3></div>'
    setHeadingTops([10, 120, 240])
    const { app } = createApp()
    const view = new OutlineView({} as never, app as never)
    view.onOpen()

    view.collapseAll()
    expect(
      view.containerEl.querySelector('[data-branch-key="heading:0"]')?.getAttribute(
        'aria-expanded',
      ),
    ).toBe('false')

    view.containerEl
      .querySelector<HTMLButtonElement>('[data-action="collapse-all"]')
      ?.click()
    expect(
      view.containerEl.querySelector('[data-branch-key="heading:0"]')?.getAttribute(
        'aria-expanded',
      ),
    ).toBe('false')

    view.containerEl
      .querySelector<HTMLButtonElement>('[data-action="expand-all"]')
      ?.click()
    expect(
      view.containerEl.querySelector('[data-branch-key="heading:0"]')?.getAttribute(
        'aria-expanded',
      ),
    ).toBe('true')
  })

  it('applies live filtering, density, and indentation settings', () => {
    vi.useFakeTimers()
    document.body.innerHTML =
      '<div id="write"><h1>One</h1><h2>Two</h2><h3>Three</h3></div>'
    setHeadingTops([10, 120, 240])
    const { app } = createApp()
    const settings = new FakeSettings()
    const view = new OutlineView({} as never, app as never, settings as never)
    view.onOpen()

    settings.set('minHeadingLevel', 2)
    settings.set('density', 'compact')
    settings.set('indentation', 'large')
    settings.set('wrapHeadingLabels', false)
    vi.advanceTimersByTime(120)

    expect(labels(view)).toEqual(['Two', 'Three'])
    expect(view.containerEl.classList.contains('outline-view--compact')).toBe(true)
    expect(view.containerEl.classList.contains('outline-view--indent-large')).toBe(
      true,
    )
    expect(view.containerEl.classList.contains('outline-view--truncate')).toBe(
      true,
    )
    expect(view.containerEl.classList.contains('outline-view--wrap')).toBe(false)
  })

  it('shows a specific state when level settings hide every heading', () => {
    document.body.innerHTML = '<div id="write"><h1>One</h1></div>'
    setHeadingTops([10])
    const { app } = createApp()
    const settings = new FakeSettings()
    settings.set('minHeadingLevel', 2)
    const view = new OutlineView({} as never, app as never, settings as never)

    view.onOpen()

    expect(view.containerEl.querySelector('[role="status"]')?.textContent).toBe(
      'No headings match the current level settings.',
    )
  })

  it('updates active state on scroll without refreshing the parsed tree', () => {
    vi.useFakeTimers()
    document.body.innerHTML =
      '<div id="write"><h1 cid="one">One</h1><h2 cid="two">Two</h2><h3 cid="three">Three</h3><h4 cid="four">Four</h4></div>'
    setHeadingTops([-300, -180, -60, 10])
    const scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
    const { app, markdownEditor } = createApp()
    const settings = new FakeSettings()
    const view = new OutlineView({} as never, app as never, settings as never)
    const refresh = vi.spyOn(view, 'refresh')

    view.onOpen()
    markdownEditor.emit('scroll')
    vi.advanceTimersByTime(40)

    const active = view.containerEl.querySelector('.outline-view__item.is-active')
    expect(active?.textContent).toBe('Four')
    expect(active?.getAttribute('aria-current')).toBe('location')
    expect(
      view.containerEl.querySelector('[data-branch-key="cid:three"]')?.getAttribute(
        'aria-expanded',
      ),
    ).toBe('true')
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    })
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('does not track or auto-scroll when follow mode is disabled', () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div id="write"><h1>One</h1></div>'
    setHeadingTops([10])
    const scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
    const { app, markdownEditor } = createApp()
    const settings = new FakeSettings()
    settings.set('followActiveHeading', false)
    const view = new OutlineView({} as never, app as never, settings as never)

    view.onOpen()
    markdownEditor.emit('scroll')
    vi.advanceTimersByTime(40)

    expect(view.containerEl.querySelector('.is-active')).toBeNull()
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('remembers independent collapse state for each file in the session', () => {
    vi.useFakeTimers()
    document.body.innerHTML =
      '<div id="write"><h1 cid="root">Root</h1><h2 cid="child">Child</h2></div>'
    setHeadingTops([10, 120])
    const { app, workspace } = createApp('doc.md')
    const settings = new FakeSettings()
    const view = new OutlineView({} as never, app as never, settings as never)
    view.onOpen()
    view.collapseAll()

    workspace.activeFile = 'second.md'
    workspace.emit('file:open')
    vi.advanceTimersByTime(120)
    expect(
      view.containerEl.querySelector('[data-branch-key="cid:root"]')?.getAttribute(
        'aria-expanded',
      ),
    ).toBe('true')

    workspace.activeFile = 'doc.md'
    workspace.emit('file:open')
    vi.advanceTimersByTime(120)
    expect(
      view.containerEl.querySelector('[data-branch-key="cid:root"]')?.getAttribute(
        'aria-expanded',
      ),
    ).toBe('false')
  })

  it('applies default collapse behavior to branches added after state is remembered', () => {
    vi.useFakeTimers()
    document.body.innerHTML =
      '<div id="write"><h1 cid="root">Root</h1><h2 cid="section">Section</h2></div>'
    setHeadingTops([10, 120])
    const { app, markdownEditor } = createApp()
    const settings = new FakeSettings()
    const view = new OutlineView({} as never, app as never, settings as never)
    view.onOpen()

    const editor = document.querySelector('#write')!
    editor.insertAdjacentHTML(
      'beforeend',
      '<h3 cid="new-branch">New branch</h3><h4 cid="new-child">New child</h4>',
    )
    setHeadingTops([10, 120, 240, 360])
    markdownEditor.emit('edit')
    vi.advanceTimersByTime(120)

    expect(
      view.containerEl
        .querySelector('[data-branch-key="cid:new-branch"]')
        ?.getAttribute('aria-expanded'),
    ).toBe('false')
  })

  it('keeps collapse state attached to fallback headings when an earlier heading is inserted', () => {
    vi.useFakeTimers()
    document.body.innerHTML =
      '<div id="write"><h1>Root</h1><h2>Child</h2></div>'
    setHeadingTops([10, 120])
    const { app, markdownEditor } = createApp()
    const view = new OutlineView({} as never, app as never)
    view.onOpen()
    view.collapseAll()

    const inserted = document.createElement('h1')
    inserted.textContent = 'Inserted'
    document.querySelector('#write')!.prepend(inserted)
    setHeadingTops([-100, 10, 120])
    markdownEditor.emit('edit')
    vi.advanceTimersByTime(120)

    expect(
      view.containerEl
        .querySelector('[data-branch-key="heading:0"]')
        ?.getAttribute('aria-expanded'),
    ).toBe('false')
  })
})
