import { describe, expect, it, vi } from 'vitest'

import {
  OUTLINE_VIEW_TYPE,
  OUTLINE_VIEW_URI,
  RightDockPlacement,
  type RightDockLeaf,
} from './right-dock'

function createLeaf(viewType = OUTLINE_VIEW_TYPE): RightDockLeaf {
  return {
    type: 'leaf',
    viewType,
    view: { name: 'outline' },
    detach: vi.fn(),
  }
}

function createApp(leaves: RightDockLeaf[] = []) {
  const rightSplit = {
    findLeaf: vi.fn(
      (predicate: (leaf: RightDockLeaf) => boolean) =>
        leaves.find(predicate) ?? null,
    ),
    filterLeaves: vi.fn(
      (predicate: (leaf: RightDockLeaf) => boolean) => leaves.filter(predicate),
    ),
    expand: vi.fn(),
    toggle: vi.fn(),
  }
  const commands = { run: vi.fn() }

  return {
    app: { workspace: { rightSplit }, commands },
    commands,
    rightSplit,
  }
}

describe('RightDockPlacement', () => {
  it('creates a missing outline leaf and expands the dock', () => {
    const { app, commands, rightSplit } = createApp()
    const placement = new RightDockPlacement(app)

    placement.open()

    expect(commands.run).toHaveBeenCalledWith(
      'core.workspace.right-split:ensure-leaf',
      [OUTLINE_VIEW_URI],
    )
    expect(rightSplit.expand).toHaveBeenCalledOnce()
  })

  it('reuses an existing outline leaf by viewType', () => {
    const leaf = createLeaf()
    const { app, commands, rightSplit } = createApp([leaf])
    const placement = new RightDockPlacement(app)

    placement.open()

    expect(commands.run).not.toHaveBeenCalled()
    expect(rightSplit.expand).toHaveBeenCalledOnce()
  })

  it('toggles the dock when the outline leaf exists', () => {
    const { app, commands, rightSplit } = createApp([createLeaf()])
    const placement = new RightDockPlacement(app)

    placement.toggle()

    expect(rightSplit.toggle).toHaveBeenCalledOnce()
    expect(rightSplit.expand).not.toHaveBeenCalled()
    expect(commands.run).not.toHaveBeenCalled()
  })

  it('opens the outline when toggle is called before the leaf exists', () => {
    const { app, commands, rightSplit } = createApp()
    const placement = new RightDockPlacement(app)

    placement.toggle()

    expect(commands.run).toHaveBeenCalledWith(
      'core.workspace.right-split:ensure-leaf',
      [OUTLINE_VIEW_URI],
    )
    expect(rightSplit.expand).toHaveBeenCalledOnce()
    expect(rightSplit.toggle).not.toHaveBeenCalled()
  })

  it('returns the registered outline view', () => {
    const leaf = createLeaf()
    const { app } = createApp([leaf])
    const placement = new RightDockPlacement(app)

    expect(placement.getView()).toBe(leaf.view)
  })

  it('detaches every outline leaf during disposal', () => {
    const outlineOne = createLeaf()
    const other = createLeaf('another.view')
    const outlineTwo = createLeaf()
    const { app } = createApp([outlineOne, other, outlineTwo])
    const placement = new RightDockPlacement(app)

    placement.dispose()

    expect(outlineOne.detach).toHaveBeenCalledOnce()
    expect(outlineTwo.detach).toHaveBeenCalledOnce()
    expect(other.detach).not.toHaveBeenCalled()
  })
})
