import { afterEach, describe, expect, it, vi } from 'vitest'

import OutlinePlugin from './main'
import {
  OUTLINE_VIEW_TYPE,
  OUTLINE_VIEW_URI,
  type RightDockLeaf,
} from './placement/right-dock'
import { OutlineView } from './views/outline-view'

type RegisteredCommand = {
  id: string
  title: string
  scope: string
  callback(): void
}

function createPlugin(
  app: unknown,
  settings: Record<string, unknown> = {},
) {
  return new OutlinePlugin(
    app as never,
    {
      id: 'prisant-labs.outline-view',
      name: 'Outline View',
      __settings: settings,
    } as never,
  )
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
  const unregisterView = vi.fn()
  const viewManager = {
    registerView: vi.fn(
      (
        _type: string,
        _factory: (leaf: never) => OutlineView,
      ) => unregisterView,
    ),
  }

  return {
    app: {
      commands,
      viewManager,
      workspace: { rightSplit },
      features: { markdownEditor: { on: vi.fn() } },
    },
    commands,
    rightSplit,
    unregisterView,
    viewManager,
  }
}

function registeredCommands(plugin: OutlinePlugin) {
  return (plugin as unknown as { registeredCommands: RegisteredCommand[] })
    .registeredCommands
}

describe('OutlinePlugin', () => {
  afterEach(() => document.body.replaceChildren())

  it('registers settings, the settings tab, the view, and manual commands', () => {
    const { app, viewManager } = createApp()
    const plugin = createPlugin(app)

    plugin.onload()

    expect(plugin.settings.filename).toBe('data/prisant-labs.outline-view')
    expect(plugin.settings.get('autoOpen')).toBe(false)
    expect(plugin.settings.get('followActiveHeading')).toBe(true)
    expect(
      (plugin as unknown as { registeredSettingTabs: Array<{ name: string }> })
        .registeredSettingTabs.map(({ name }) => name),
    ).toEqual(['Outline View'])
    expect(viewManager.registerView).toHaveBeenCalledOnce()
    expect(viewManager.registerView.mock.calls[0][0]).toBe(OUTLINE_VIEW_TYPE)

    const factory = viewManager.registerView.mock.calls[0][1] as (
      leaf: never,
    ) => OutlineView
    expect(factory({} as never)).toBeInstanceOf(OutlineView)
    expect(
      registeredCommands(plugin).map(({ id, title, scope }) => ({
        id,
        title,
        scope,
      })),
    ).toEqual([
      { id: 'toggle', title: 'Toggle', scope: 'global' },
      { id: 'refresh', title: 'Refresh', scope: 'global' },
      { id: 'expand-all', title: 'Expand All', scope: 'global' },
      { id: 'collapse-all', title: 'Collapse All', scope: 'global' },
    ])
  })

  it('does not open automatically by default', () => {
    const { app, rightSplit } = createApp()
    const plugin = createPlugin(app)

    plugin.onload()

    expect(rightSplit.expand).not.toHaveBeenCalled()
  })

  it('opens the Outline View settings tab from the view toolbar', () => {
    document.body.innerHTML = `
      <div class="typ-settings-modal">
        <button class="typ-nav__item" data-name="Outline View">Outline View</button>
      </div>
    `
    const tab = document.querySelector<HTMLElement>('[data-name="Outline View"]')!
    const click = vi.spyOn(tab, 'click')
    const { app, commands, viewManager } = createApp()
    const plugin = createPlugin(app)
    plugin.onload()

    const factory = viewManager.registerView.mock.calls[0][1] as (
      leaf: never,
    ) => OutlineView
    const view = factory({} as never)
    view.containerEl
      .querySelector<HTMLButtonElement>('[data-action="open-settings"]')
      ?.click()

    expect(commands.run).toHaveBeenCalledWith('settings:open')
    expect(click).toHaveBeenCalledOnce()
  })

  it('labels the core dock toggle while loaded and restores it on unload', () => {
    document.body.innerHTML = `
      <footer class="ty-footer">
        <div id="dock" class="footer-item footer-item-right" ty-hint="Toggle right sidebar" aria-label="Toggle right sidebar"><i class="fa fa-align-right"></i></div>
      </footer>
    `
    const { app } = createApp()
    const plugin = createPlugin(app)

    plugin.onload()

    const dock = document.querySelector('#dock')!
    expect(dock.getAttribute('ty-hint')).toBe('Toggle outline sidebar')
    expect(dock.getAttribute('aria-label')).toBe('Toggle outline sidebar')

    plugin.unload()
    expect(dock.getAttribute('ty-hint')).toBe('Toggle right sidebar')
    expect(dock.getAttribute('aria-label')).toBe('Toggle right sidebar')
  })

  it('opens automatically when the persisted option is enabled', () => {
    const { app, rightSplit } = createApp()
    const plugin = createPlugin(app, { autoOpen: true })

    plugin.onload()

    expect(rightSplit.expand).toHaveBeenCalledOnce()
  })

  it('connects the toggle command to right-dock placement', () => {
    const { app, commands, rightSplit } = createApp()
    const plugin = createPlugin(app)
    plugin.onload()

    registeredCommands(plugin).find(({ id }) => id === 'toggle')?.callback()

    expect(commands.run).toHaveBeenCalledWith(
      'core.workspace.right-split:ensure-leaf',
      [OUTLINE_VIEW_URI],
    )
    expect(rightSplit.expand).toHaveBeenCalledOnce()
  })

  it('opens and refreshes the view from the refresh command', () => {
    const refresh = vi.fn()
    const leaves: RightDockLeaf[] = []
    const { app, commands } = createApp(leaves)
    commands.run.mockImplementation(() => {
      leaves.push({
        type: 'leaf',
        viewType: OUTLINE_VIEW_TYPE,
        view: { refresh },
        detach: vi.fn(),
      })
    })
    const plugin = createPlugin(app)
    plugin.onload()

    registeredCommands(plugin).find(({ id }) => id === 'refresh')?.callback()

    expect(refresh).toHaveBeenCalledOnce()
  })

  it('connects expand-all and collapse-all commands to the open view', () => {
    const expandAll = vi.fn()
    const collapseAll = vi.fn()
    const leaves: RightDockLeaf[] = [
      {
        type: 'leaf',
        viewType: OUTLINE_VIEW_TYPE,
        view: { expandAll, collapseAll },
        detach: vi.fn(),
      },
    ]
    const { app } = createApp(leaves)
    const plugin = createPlugin(app)
    plugin.onload()

    registeredCommands(plugin).find(({ id }) => id === 'expand-all')?.callback()
    registeredCommands(plugin)
      .find(({ id }) => id === 'collapse-all')
      ?.callback()

    expect(expandAll).toHaveBeenCalledOnce()
    expect(collapseAll).toHaveBeenCalledOnce()
  })

  it('detaches outline leaves when the plugin unloads', () => {
    const outlineLeaf: RightDockLeaf = {
      type: 'leaf',
      viewType: OUTLINE_VIEW_TYPE,
      view: {},
      detach: vi.fn(),
    }
    const otherLeaf: RightDockLeaf = {
      type: 'leaf',
      viewType: 'another.view',
      view: {},
      detach: vi.fn(),
    }
    const { app } = createApp([outlineLeaf, otherLeaf])
    const plugin = createPlugin(app)
    plugin.onload()

    plugin.onunload()

    expect(outlineLeaf.detach).toHaveBeenCalledOnce()
    expect(otherLeaf.detach).not.toHaveBeenCalled()
  })
})
