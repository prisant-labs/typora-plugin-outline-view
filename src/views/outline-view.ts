import {
  WorkspaceView,
  type App,
  type PluginSettings,
  type WorkspaceLeaf,
} from '@typora-community-plugin/core'

import {
  isEditorAtBottom,
  selectActiveHeading,
} from '../outline/active-heading'
import {
  collapseAll,
  createCollapsedState,
  revealAncestors,
  toggleCollapsed,
  type RememberedCollapseState,
} from '../outline/collapse'
import type {
  OutlineHeading,
  OutlineNode,
} from '../outline/model'
import { navigateToHeading } from '../outline/navigation'
import { parseHeadings } from '../outline/parser'
import { renderOutline } from '../outline/render'
import { createDebouncedTask } from '../outline/scheduler'
import { buildOutlineTree, filterHeadings } from '../outline/tree'
import { OUTLINE_VIEW_TYPE } from '../placement/right-dock'
import {
  readOutlineSettings,
  type OutlineSettings,
} from '../settings/model'

import { HeadingRangeSelector, type HeadingRange } from '../outline/range-selector'
import { applyOutlineAppearance } from '../outline/appearance'
import { outlineIcon } from '../integration/icons'

const REFRESH_DELAY_MS = 120
const ACTIVE_HEADING_DELAY_MS = 32
const ACTIVE_HEADING_OFFSET_PX = 32

function sameSet(left: ReadonlySet<string>, right: ReadonlySet<string>) {
  if (left.size !== right.size) return false
  return [...left].every((key) => right.has(key))
}

export class OutlineView extends WorkspaceView {
  static readonly type = OUTLINE_VIEW_TYPE

  containerEl: HTMLElement
  icon = 'fa-list-ul'

  private readonly contentEl: HTMLElement
  private readonly wrapButton = document.createElement('button')
  private readonly rangeSelector: HeadingRangeSelector
  private readonly rangeByFile = new Map<string, HeadingRange>()
  private renderedFileKey?: string
  private readonly collapseStateByFile = new Map<
    string,
    RememberedCollapseState
  >()
  private fullTree: OutlineNode[] = []
  private tree: OutlineNode[] = []
  private headings: OutlineHeading[] = []
  private collapsedKeys = new Set<string>()
  private activeKey?: string
  private emptyMessage = 'No headings in this document.'
  private readonly refreshTask = createDebouncedTask(
    () => this.refresh(),
    REFRESH_DELAY_MS,
  )
  private readonly activeHeadingTask = createDebouncedTask(
    () => this.updateActiveHeading(),
    ACTIVE_HEADING_DELAY_MS,
  )

  constructor(
    leaf: WorkspaceLeaf,
    private readonly app: App,
    private readonly settings?: PluginSettings<OutlineSettings>,
    private readonly onOpenSettings: () => void = () => undefined,
  ) {
    super(leaf)

    this.containerEl = document.createElement('section')
    this.containerEl.className = 'outline-view'
    this.containerEl.setAttribute('aria-label', 'Outline View')

    const toolbar = document.createElement('div')
    toolbar.className = 'outline-view__toolbar'
    toolbar.setAttribute('role', 'toolbar')
    toolbar.setAttribute('aria-label', 'Outline controls')
    toolbar.append(
      this.createToolbarButton('collapse-all', 'Collapse all', () =>
        this.collapseAll(),
      ),
      this.createToolbarButton('expand-all', 'Expand all', () =>
        this.expandAll(),
      ),
    )

    const toolbarSpacer = document.createElement('span')
    toolbarSpacer.className = 'outline-view__toolbar-spacer'
    toolbarSpacer.setAttribute('aria-hidden', 'true')

    this.wrapButton.className = 'outline-view__wrap-button'
    this.wrapButton.type = 'button'
    this.wrapButton.dataset.action = 'toggle-wrap'
    this.wrapButton.setAttribute('aria-label', 'Word wrap')
    this.wrapButton.disabled = !this.settings
    this.syncWrapButton()

    const settingsButton = document.createElement('button')
    settingsButton.className = 'outline-view__config-button'
    settingsButton.type = 'button'
    settingsButton.dataset.action = 'open-settings'
    settingsButton.title = 'Configure Outline View'
    settingsButton.setAttribute('aria-label', 'Configure Outline View')
    settingsButton.append(outlineIcon('settings'))
    settingsButton.addEventListener('click', () => this.onOpenSettings())
    toolbar.append(toolbarSpacer, this.wrapButton, settingsButton)

    this.rangeSelector = new HeadingRangeSelector(range => {
      this.rangeByFile.set(this.renderedFileKey ?? this.activeFileKey(), range)
      this.refresh()
    })

    this.contentEl = document.createElement('div')
    this.contentEl.className = 'outline-view__content'

    this.containerEl.append(toolbar, this.rangeSelector.element, this.contentEl)
  }

  onOpen() {
    this.refresh()
    const toggleWrap = () => {
      this.settings?.set('wrapHeadingLabels', !this.currentSettings().wrapHeadingLabels)
      this.syncWrapButton()
    }
    this.wrapButton.addEventListener('click', toggleWrap)
    this.register(() => this.wrapButton.removeEventListener('click', toggleWrap))

    this.register(
      this.app.workspace.on('file:open', () => {
        this.rangeSelector.endGesture()
        this.refreshTask.schedule()
      }),
    )
    this.register(
      this.app.features.markdownEditor.on('load', this.refreshTask.schedule),
    )
    this.register(
      this.app.features.markdownEditor.on('edit', this.refreshTask.schedule),
    )
    this.register(
      this.app.features.markdownEditor.on(
        'scroll',
        this.activeHeadingTask.schedule,
      ),
    )
    if (this.settings) {
      this.register(
        this.settings.onChange('*', (key) => {
          if (key === 'wrapHeadingLabels') this.syncWrapButton()
          if (key === 'minHeadingLevel' || key === 'maxHeadingLevel') {
            this.rangeSelector.endGesture()
            this.rangeByFile.clear()
          }
          if (key === 'expandThroughLevel') this.collapseStateByFile.clear()
          this.refreshTask.schedule()
        }),
      )
    }
    this.register(() => this.rangeSelector.destroy())
    this.register(this.refreshTask.cancel)
    this.register(this.activeHeadingTask.cancel)
  }

  refresh() {
    this.syncWrapButton()
    const fileKey = this.activeFileKey()
    if (fileKey !== this.renderedFileKey) this.rangeSelector.endGesture()
    this.renderedFileKey = fileKey
    const editor = document.querySelector<HTMLElement>('#write')
    const settings = this.currentSettings()
    applyOutlineAppearance(this.containerEl, settings)
    const range = this.rangeByFile.get(this.activeFileKey()) ?? { start: settings.minHeadingLevel, end: settings.maxHeadingLevel }
    this.rangeSelector.update(range, settings)

    if (!editor) {
      this.fullTree = []
      this.tree = []
      this.headings = []
      this.activeKey = undefined
      this.showStatus('Open a Markdown document to see its outline.')
      return
    }

    const parsedHeadings = parseHeadings(editor)
    this.fullTree = buildOutlineTree(parsedHeadings)
    this.headings = filterHeadings(
      parsedHeadings,
      range.start,
      range.end,
    )
    this.tree = buildOutlineTree(this.headings)
    this.emptyMessage =
      parsedHeadings.length > 0 && this.headings.length === 0
        ? 'No headings match the current level settings.'
        : 'No headings in this document.'

    const remembered = settings.rememberCollapseState
      ? this.collapseStateByFile.get(fileKey)
      : undefined
    this.collapsedKeys = createCollapsedState(
      this.fullTree,
      settings.expandThroughLevel,
      remembered,
    )
    this.rememberCollapseState()
    this.activeKey = undefined
    this.renderTree()
    this.updateActiveHeading()
  }

  expandAll() {
    const visibleBranchKeys = collapseAll(this.tree)
    this.collapsedKeys = new Set(
      [...this.collapsedKeys].filter((key) => !visibleBranchKeys.has(key)),
    )
    this.rememberCollapseState()
    this.renderTree()
  }

  collapseAll() {
    this.collapsedKeys = new Set([
      ...this.collapsedKeys,
      ...collapseAll(this.tree),
    ])
    this.rememberCollapseState()
    this.renderTree()
  }

  private createToolbarButton(
    action: string,
    label: string,
    callback: () => void,
  ) {
    const button = document.createElement('button')
    button.className = 'outline-view__toolbar-button'
    button.type = 'button'
    button.dataset.action = action
    button.title = label
    button.setAttribute('aria-label', label)
    button.textContent = label
    button.addEventListener('click', callback)
    return button
  }

  private currentSettings() {
    return readOutlineSettings(this.settings)
  }

  private syncWrapButton() {
    const wrap = this.currentSettings().wrapHeadingLabels
    const state = String(wrap)
    if (this.wrapButton.getAttribute('aria-pressed') === state) return
    this.wrapButton.setAttribute('aria-pressed', state)
    this.wrapButton.title = wrap ? 'Word wrap on. Click to turn off.' : 'Word wrap off. Click to turn on.'
    this.wrapButton.replaceChildren(outlineIcon(wrap ? 'wrap' : 'nowrap'))
  }

  private activeFileKey() {
    return this.app.workspace.activeFile || '__untitled__'
  }

  private rememberCollapseState() {
    if (!this.currentSettings().rememberCollapseState) return
    this.collapseStateByFile.set(
      this.activeFileKey(),
      {
        collapsedKeys: new Set(this.collapsedKeys),
        knownBranchKeys: collapseAll(this.fullTree),
      },
    )
  }

  private toggleBranch(node: OutlineNode) {
    this.collapsedKeys = toggleCollapsed(this.collapsedKeys, node.key)
    this.rememberCollapseState()
    this.renderTree()
  }

  private renderTree() {
    renderOutline(this.contentEl, this.tree, {
      collapsedKeys: this.collapsedKeys,
      activeKey: this.activeKey,
      emptyMessage: this.emptyMessage,
      headingStyles: this.currentSettings().headingStyles,
      onNavigate: navigateToHeading,
      onToggle: (node) => this.toggleBranch(node),
    })
  }

  private showStatus(message: string) {
    const status = document.createElement('p')
    status.className = 'outline-view__empty'
    status.setAttribute('role', 'status')
    status.textContent = message
    this.contentEl.replaceChildren(status)
  }

  private updateActiveHeading() {
    const settings = this.currentSettings()
    const editor = document.querySelector<HTMLElement>('#write')

    if (!settings.followActiveHeading || !editor || this.headings.length === 0) {
      this.activeKey = undefined
      this.syncActiveItem(false)
      return
    }

    const thresholdTop =
      editor.getBoundingClientRect().top + ACTIVE_HEADING_OFFSET_PX
    const active = selectActiveHeading(this.headings, {
      thresholdTop,
      atDocumentEnd: isEditorAtBottom(editor),
    })
    this.activeKey = active?.key

    if (this.activeKey) {
      const revealed = revealAncestors(
        this.tree,
        this.collapsedKeys,
        this.activeKey,
      )
      if (!sameSet(revealed, this.collapsedKeys)) {
        this.collapsedKeys = revealed
        this.rememberCollapseState()
        this.renderTree()
      }
    }

    this.syncActiveItem(settings.autoScrollOutline)
  }

  private syncActiveItem(autoScroll: boolean) {
    let activeItem: HTMLElement | undefined

    for (const item of Array.from(
      this.contentEl.querySelectorAll<HTMLElement>('.outline-view__item'),
    )) {
      const isActive = item.dataset.headingKey === this.activeKey
      item.classList.toggle('is-active', isActive)
      if (isActive) {
        item.setAttribute('aria-current', 'location')
        activeItem = item
      } else {
        item.removeAttribute('aria-current')
      }
    }

    if (autoScroll && activeItem) {
      // scrollIntoView also scrolls host ancestors and can shift the whole dock
      // horizontally. Follow only within our own vertical content viewport.
      const top = this.contentEl.getBoundingClientRect().top + this.contentEl.clientTop
      const bottom = top + this.contentEl.clientHeight
      const item = activeItem.getBoundingClientRect()
      if (this.contentEl.clientHeight > 0) {
        const oversized = item.bottom - item.top > this.contentEl.clientHeight
        if (item.top < top && item.bottom < bottom) {
          this.contentEl.scrollTop += oversized ? item.bottom - bottom : item.top - top
        } else if (item.bottom > bottom && item.top > top) {
          this.contentEl.scrollTop += oversized ? item.top - top : item.bottom - bottom
        }
      }
    }
  }
}
