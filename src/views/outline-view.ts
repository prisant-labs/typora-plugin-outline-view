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
  HeadingLevel,
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
  DEFAULT_OUTLINE_SETTINGS,
  HEADING_LEVEL_OPTIONS,
  normalizeOutlineSettings,
  type OutlineSettings,
} from '../settings/model'

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
  private readonly levelSelectorEl: HTMLElement
  private readonly levelValueEl: HTMLElement
  private readonly levelStops = new Map<HeadingLevel, HTMLButtonElement>()
  private readonly maxLevelByFile = new Map<string, HeadingLevel>()
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

    const settingsButton = document.createElement('button')
    settingsButton.className = 'outline-view__config-button'
    settingsButton.type = 'button'
    settingsButton.dataset.action = 'open-settings'
    settingsButton.title = 'Configure Outline View'
    settingsButton.setAttribute('aria-label', 'Configure Outline View')
    settingsButton.innerHTML =
      '<span class="fa fa-cog" aria-hidden="true"></span>'
    settingsButton.addEventListener('click', () => this.onOpenSettings())
    toolbar.append(toolbarSpacer, settingsButton)

    this.levelSelectorEl = document.createElement('div')
    this.levelSelectorEl.className = 'outline-view__level-selector'
    this.levelSelectorEl.dataset.level = '6'
    this.levelSelectorEl.setAttribute('role', 'radiogroup')
    this.levelSelectorEl.setAttribute(
      'aria-label',
      'Maximum visible heading level',
    )

    const levelTrack = document.createElement('div')
    levelTrack.className = 'outline-view__level-track'

    for (const level of HEADING_LEVEL_OPTIONS) {
      const stop = document.createElement('button')
      stop.className = 'outline-view__level-stop'
      stop.type = 'button'
      stop.dataset.level = String(level)
      stop.dataset.included = 'true'
      stop.setAttribute('role', 'radio')
      stop.setAttribute('aria-label', `Show through H${level}`)
      stop.title = `Show through H${level}`
      stop.addEventListener('click', () => this.selectMaximumLevel(level))
      stop.addEventListener('keydown', (event) =>
        this.onLevelStopKeydown(event, level),
      )
      this.levelStops.set(level, stop)
      levelTrack.append(stop)
    }

    this.levelValueEl = document.createElement('span')
    this.levelValueEl.className = 'outline-view__level-value'
    this.levelValueEl.setAttribute('aria-live', 'polite')
    this.levelValueEl.textContent = 'Through H6'
    this.levelSelectorEl.append(levelTrack, this.levelValueEl)

    this.contentEl = document.createElement('div')
    this.contentEl.className = 'outline-view__content'

    this.containerEl.append(toolbar, this.levelSelectorEl, this.contentEl)
  }

  onOpen() {
    this.refresh()

    this.register(
      this.app.workspace.on('file:open', this.refreshTask.schedule),
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
          if (key === 'expandThroughLevel') this.collapseStateByFile.clear()
          this.refreshTask.schedule()
        }),
      )
    }
    this.register(this.refreshTask.cancel)
    this.register(this.activeHeadingTask.cancel)
  }

  refresh() {
    const editor = document.querySelector<HTMLElement>('#write')
    this.applyAppearance()
    const settings = this.currentSettings()
    const maximumHeadingLevel = this.effectiveMaximumLevel(settings)
    this.syncLevelSelector(settings.minHeadingLevel, maximumHeadingLevel)

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
      settings.minHeadingLevel,
      maximumHeadingLevel,
    )
    this.tree = buildOutlineTree(this.headings)
    this.emptyMessage =
      parsedHeadings.length > 0 && this.headings.length === 0
        ? 'No headings match the current level settings.'
        : 'No headings in this document.'

    const fileKey = this.activeFileKey()
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

  private effectiveMaximumLevel(settings: OutlineSettings) {
    const fileKey = this.activeFileKey()
    const override = this.maxLevelByFile.get(fileKey)

    if (override !== undefined && override < settings.minHeadingLevel) {
      this.maxLevelByFile.set(fileKey, settings.minHeadingLevel)
      return settings.minHeadingLevel
    }

    return override ?? settings.maxHeadingLevel
  }

  private selectMaximumLevel(level: HeadingLevel) {
    if (level < this.currentSettings().minHeadingLevel) return
    this.maxLevelByFile.set(this.activeFileKey(), level)
    this.refresh()
  }

  private syncLevelSelector(
    minimum: HeadingLevel,
    maximum: HeadingLevel,
  ) {
    this.levelSelectorEl.dataset.level = String(maximum)
    this.levelValueEl.textContent = `Through H${maximum}`

    for (const [level, stop] of this.levelStops) {
      const selected = level === maximum
      const disabled = level < minimum
      stop.disabled = disabled
      stop.dataset.included = String(level <= maximum)
      stop.setAttribute('aria-checked', String(selected))
      stop.setAttribute('aria-disabled', String(disabled))
      stop.tabIndex = selected ? 0 : -1
    }
  }

  private onLevelStopKeydown(event: KeyboardEvent, level: HeadingLevel) {
    const enabledLevels = HEADING_LEVEL_OPTIONS.filter(
      (candidate) => candidate >= this.currentSettings().minHeadingLevel,
    )
    const currentIndex = enabledLevels.indexOf(level)
    let target: HeadingLevel | undefined

    if (event.key === 'Home') target = enabledLevels[0]
    else if (event.key === 'End') target = enabledLevels.at(-1)
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      target = enabledLevels[Math.max(0, currentIndex - 1)]
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      target = enabledLevels[Math.min(enabledLevels.length - 1, currentIndex + 1)]
    } else return

    if (target === undefined) return
    event.preventDefault()
    this.selectMaximumLevel(target)
    this.levelStops.get(target)?.focus()
  }

  private currentSettings() {
    if (!this.settings) return { ...DEFAULT_OUTLINE_SETTINGS }

    return normalizeOutlineSettings({
      autoOpen: this.settings.get('autoOpen'),
      followActiveHeading: this.settings.get('followActiveHeading'),
      autoScrollOutline: this.settings.get('autoScrollOutline'),
      rememberCollapseState: this.settings.get('rememberCollapseState'),
      wrapHeadingLabels: this.settings.get('wrapHeadingLabels'),
      minHeadingLevel: this.settings.get('minHeadingLevel'),
      maxHeadingLevel: this.settings.get('maxHeadingLevel'),
      expandThroughLevel: this.settings.get('expandThroughLevel'),
      density: this.settings.get('density'),
      indentation: this.settings.get('indentation'),
    })
  }

  private applyAppearance() {
    const { density, indentation } = this.currentSettings()
    this.containerEl.classList.remove(
      'outline-view--compact',
      'outline-view--comfortable',
      'outline-view--indent-small',
      'outline-view--indent-medium',
      'outline-view--indent-large',
      'outline-view--wrap',
      'outline-view--truncate',
    )
    this.containerEl.classList.add(
      `outline-view--${density}`,
      `outline-view--indent-${indentation}`,
      this.currentSettings().wrapHeadingLabels
        ? 'outline-view--wrap'
        : 'outline-view--truncate',
    )
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
      activeItem.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    }
  }
}
