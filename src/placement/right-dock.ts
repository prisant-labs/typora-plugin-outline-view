export const OUTLINE_VIEW_TYPE = 'prisant-labs.outline-view'
export const OUTLINE_VIEW_URI = `typ://${OUTLINE_VIEW_TYPE}/Outline`

export interface RightDockLeaf {
  type: string
  viewType: string
  view: unknown
  detach(): void
}

export interface RightDockApp {
  commands: {
    run(commandId: string, args: unknown[]): void
  }
  workspace: {
    rightSplit: {
      findLeaf(
        predicate: (leaf: RightDockLeaf) => boolean,
      ): RightDockLeaf | null
      filterLeaves(
        predicate: (leaf: RightDockLeaf) => boolean,
      ): RightDockLeaf[]
      expand(): void
      toggle(): void
    }
  }
}

export class RightDockPlacement {
  constructor(private readonly app: RightDockApp) {}

  private findLeaf() {
    return this.app.workspace.rightSplit.findLeaf(
      (leaf) => leaf.viewType === OUTLINE_VIEW_TYPE,
    )
  }

  open() {
    if (!this.findLeaf()) {
      this.app.commands.run('core.workspace.right-split:ensure-leaf', [
        OUTLINE_VIEW_URI,
      ])
    }

    this.app.workspace.rightSplit.expand()
  }

  toggle() {
    if (!this.findLeaf()) {
      this.open()
      return
    }

    this.app.workspace.rightSplit.toggle()
  }

  getView<T = unknown>() {
    return (this.findLeaf()?.view as T | undefined) ?? null
  }

  dispose() {
    const outlineLeaves = this.app.workspace.rightSplit.filterLeaves(
      (leaf) => leaf.viewType === OUTLINE_VIEW_TYPE,
    )

    for (const leaf of outlineLeaves) {
      leaf.detach()
    }
  }
}
