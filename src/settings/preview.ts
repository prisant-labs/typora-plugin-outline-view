import type { OutlineSettings } from './model'
import type { OutlineHeading } from '../outline/model'
import { HeadingRangeSelector, type HeadingRange } from '../outline/range-selector'
import { applyOutlineAppearance } from '../outline/appearance'
import { parseHeadings } from '../outline/parser'
import { buildOutlineTree, filterHeadings } from '../outline/tree'
import { renderOutline } from '../outline/render'

export class OutlinePreview {
  readonly element = document.createElement('aside')
  private readonly source = document.createElement('p')
  private readonly panel = document.createElement('section')
  private readonly content = document.createElement('div')
  private readonly selector: HeadingRangeSelector
  private settings?: OutlineSettings
  private range: HeadingRange = { start: 1, end: 6 }
  private sampleOnly = false
  private readonly samples: OutlineHeading[]
  private collapsed = new Set<string>()

  constructor() {
    this.element.className = 'outline-view-settings__preview'
    this.element.setAttribute('aria-label', 'Live outline preview')
    const title = document.createElement('h3')
    title.textContent = 'Live outline preview'
    this.source.className = 'outline-view-settings__preview-source'
    const sampleLabel = document.createElement('label')
    const sampleCheckbox = document.createElement('input')
    sampleCheckbox.type = 'checkbox'
    sampleCheckbox.addEventListener('change', () => {
      this.sampleOnly = sampleCheckbox.checked
      this.collapsed.clear()
      this.render()
    })
    sampleLabel.append(sampleCheckbox, ' Use sample headings')
    this.panel.className = 'outline-view outline-view--preview'
    this.selector = new HeadingRangeSelector(range => { this.range = range; this.render() })
    this.content.className = 'outline-view__content'
    this.panel.append(this.selector.element, this.content)
    const help = document.createElement('p')
    help.className = 'outline-view-settings__preview-help'
    help.textContent = 'Appearance changes apply immediately. The range in this preview is for trying the control; use Minimum/Maximum heading level to save defaults.'
    this.element.append(title, this.source, sampleLabel, this.panel, help)
    const sample = document.createElement('div')
    const labels = ['Project overview', 'Design and structure', 'Navigation details', 'Interaction behavior', 'Edge cases and accessibility', 'Implementation notes']
    labels.forEach((text, i) => {
      const heading = document.createElement(`h${i + 1}`)
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
    this.source.textContent = live.length ? `Active document · ${live.length} headings` : 'Sample outline · H1–H6'
    applyOutlineAppearance(this.panel, this.settings)
    this.selector.update(this.range, this.settings)
    const tree = buildOutlineTree(filterHeadings(headings, this.range.start, this.range.end))
    renderOutline(this.content, tree, {
      collapsedKeys: this.collapsed,
      headingStyles: this.settings.headingStyles,
      emptyMessage: 'No headings match this preview range.',
      onNavigate: () => undefined,
      onToggle: node => {
        if (this.collapsed.has(node.key)) this.collapsed.delete(node.key)
        else this.collapsed.add(node.key)
        this.render()
      },
    })
  }

  destroy() { this.selector.destroy() }
  suspend() { this.selector.endGesture() }
}
