import type { OutlineSettings } from './model'
import type { OutlineHeading } from '../outline/model'
import { HeadingRangeSelector, type HeadingRange } from '../outline/range-selector'
import { applyOutlineAppearance } from '../outline/appearance'
import { parseHeadings } from '../outline/parser'
import {
  buildOutlineTree,
  filterHeadings,
  focusOutlineTree,
  pathToOutlineNode,
} from '../outline/tree'
import { renderOutline } from '../outline/render'
import { SAMPLE_HEADINGS } from './sample-headings'
import { createCurrentPath, renderCurrentPath } from '../outline/current-path'

export class OutlinePreview {
  readonly element = document.createElement('aside')
  private readonly source = document.createElement('p')
  private readonly panel = document.createElement('section')
  private readonly content = document.createElement('div')
  private readonly currentPath = createCurrentPath()
  private readonly selector: HeadingRangeSelector
  private settings?: OutlineSettings
  private range: HeadingRange = { start: 1, end: 6 }
  private sampleOnly = false
  private readonly samples: OutlineHeading[]
  private collapsed = new Set<string>()
  private activeKey?: string

  constructor() {
    this.element.className = 'outline-view-settings__preview'
    this.element.setAttribute('aria-label', 'Live outline view')
    const title = document.createElement('h3')
    title.textContent = 'Live outline view'
    const metadata = document.createElement('div')
    metadata.className = 'outline-view-settings__preview-meta'
    this.source.className = 'outline-view-settings__preview-source'
    const sampleLabel = document.createElement('label')
    const sampleCheckbox = document.createElement('input')
    sampleCheckbox.type = 'checkbox'
    sampleCheckbox.addEventListener('change', () => {
      this.sampleOnly = sampleCheckbox.checked
      this.collapsed.clear()
      this.render()
    })
    sampleLabel.append(sampleCheckbox, ' Use samples')
    metadata.append(this.source, sampleLabel)
    this.panel.className = 'outline-view outline-view--preview'
    this.selector = new HeadingRangeSelector(range => { this.range = range; this.render() })
    this.content.className = 'outline-view__content'
    this.panel.append(this.selector.element, this.currentPath, this.content)
    this.element.append(title, metadata, this.panel)
    const sample = document.createElement('div')
    SAMPLE_HEADINGS.forEach(([level, text]) => {
      const heading = document.createElement(`h${level}`)
      heading.textContent = text
      sample.append(heading)
    })
    this.samples = parseHeadings(sample)
  }

  update(settings: OutlineSettings) {
    if (!this.settings || settings.minHeadingLevel !== this.settings.minHeadingLevel || settings.maxHeadingLevel !== this.settings.maxHeadingLevel) {
      this.range = { start: settings.minHeadingLevel, end: settings.maxHeadingLevel }
    }
    this.settings = settings
    this.render()
  }

  refresh = () => { this.collapsed.clear(); this.render() }

  private render() {
    if (!this.settings) return
    const editor = document.querySelector<HTMLElement>('#write')
    const live = editor && !this.sampleOnly ? parseHeadings(editor) : []
    const headings = live.length ? live : this.samples
    if (!headings.some(({ key }) => key === this.activeKey)) {
      this.activeKey = headings.find(({ level }) => level >= 3)?.key ?? headings[0]?.key
    }
    this.source.textContent = live.length ? `Active document · ${live.length} headings` : 'Sample outline · H1–H6'
    applyOutlineAppearance(this.panel, this.settings)
    this.selector.update(this.range, this.settings)
    const baseTree = buildOutlineTree(filterHeadings(headings, this.range.start, this.range.end))
    const path = this.activeKey ? pathToOutlineNode(baseTree, this.activeKey) : []
    const tree = this.settings.focusCurrentBranch && this.activeKey
      ? focusOutlineTree(baseTree, this.activeKey)
      : baseTree
    renderOutline(this.content, tree, {
      collapsedKeys: this.collapsed,
      activeKey: this.activeKey,
      headingStyles: this.settings.headingStyles,
      collapseIcon: this.settings.collapseIcon,
      activePathKeys: this.settings.emphasizeActivePath ? new Set(path.slice(0, -1).map(node => node.key)) : undefined,
      emptyMessage: 'No headings match this preview range.',
      onNavigate: node => { this.activeKey = node.key; this.render() },
      onToggle: node => {
        if (this.collapsed.has(node.key)) this.collapsed.delete(node.key)
        else this.collapsed.add(node.key)
        this.render()
      },
    })
    renderCurrentPath(this.currentPath, path, node => { this.activeKey = node.key; this.render() }, this.settings.showCurrentPathBar)
  }

  destroy() { this.selector.destroy() }
  suspend() { this.selector.endGesture() }
}
