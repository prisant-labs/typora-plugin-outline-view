import { afterEach, describe, expect, it, vi } from 'vitest'

// jsdom has no IndexedDB: keep the update record in memory, shared like the real per-profile database.
const updates = vi.hoisted(() => ({ record: { checkForUpdates: true } as Record<string, unknown> }))
vi.mock('./update/update-store', () => ({ UpdateStore: class {
  async read() { return structuredClone(updates.record) }
  async update(change: (record: Record<string, unknown>) => Record<string, unknown>) { updates.record = structuredClone(change(structuredClone(updates.record))); return structuredClone(updates.record) }
  async close() {}
} }))

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

describe('OutlinePlugin updates', () => {
  const ID = 'prisant-labs.outline-view'

  afterEach(() => {
    document.body.replaceChildren()
    vi.useRealTimers()
  })

  /** A host with Core's plugin manager, one outline leaf, and GitHub's release lookup. */
  function updateHost(marketplace: object, updatePlugin: (id: string) => Promise<void>) {
    const leaf = { type: 'leaf', viewType: OUTLINE_VIEW_TYPE, view: undefined as OutlineView | undefined, detach: vi.fn(() => { leaf.view?.unload(); leaf.view?.containerEl.remove() }) }
    const app = {
      commands: { run: vi.fn() },
      viewManager: { registerView: vi.fn((_type: string, _factory: (leaf: never) => OutlineView) => () => {}) },
      workspace: {
        activeFile: undefined, on: vi.fn(() => () => {}),
        rightSplit: { findLeaf: vi.fn(() => null), filterLeaves: vi.fn((predicate: (leaf: RightDockLeaf) => boolean) => [leaf as unknown as RightDockLeaf].filter(predicate)), expand: vi.fn(), toggle: vi.fn() },
      },
      features: { markdownEditor: { on: vi.fn(() => () => {}) } },
      plugins: { marketplace, updatePlugin: vi.fn(updatePlugin) },
      openLink: vi.fn(),
      github: { getReleaseInfo: vi.fn(async () => ({ tag_name: '0.3.4', published_at: '2026-10-01T16:00:00Z' })) },
    }
    const plugin = new OutlinePlugin(app as never, { id: ID, name: 'Outline View', version: '0.3.2', repo: 'prisant-labs/typora-plugin-outline-view' } as never)
    const openView = () => {
      const factory = app.viewManager.registerView.mock.calls[0][1]
      leaf.view = factory(leaf as never)
      document.body.append(leaf.view.containerEl)
      leaf.view.onOpen()
      return leaf.view
    }
    const openSettings = () => {
      const tab = (plugin as unknown as { registeredSettingTabs: Array<{ containerEl: HTMLElement; onshow(): void }> }).registeredSettingTabs[0]
      document.body.append(tab.containerEl); tab.onshow()
      return tab
    }
    // Core's uninstall: unloadPlugin runs onunload, then the registered disposers.
    const coreUnload = () => { plugin.onunload(); plugin.unload() }
    return { app, plugin, openView, openSettings, coreUnload }
  }
  const dialogs = () => [...document.querySelectorAll<HTMLElement>('.typ-modal__wrapper')].filter(node => node.style.display !== 'none')
  const dialogButton = (name: string) => [...dialogs()[0].querySelectorAll('button')].find(node => node.textContent === name)!

  it('shows Core\'s newer version as pills and updates through Core after confirmation', async () => {
    vi.useFakeTimers()
    updates.record = { checkForUpdates: true }
    const info: { id: string; newestVersion?: string } = { id: ID }
    const marketplace = {
      pluginList: [] as unknown[],
      get isLoaded() { return marketplace.pluginList.length > 0 },
      getPlugin: vi.fn((id: string) => marketplace.pluginList.find(entry => (entry as { id: string }).id === id)),
      loadCommunityPlugins: vi.fn(async () => { marketplace.pluginList = [info]; info.newestVersion = '0.3.4' }),
      getPluginNewestVersion: vi.fn(async (entry: { newestVersion?: string }) => entry.newestVersion),
    }
    // Core's update unloads the running plugin before it downloads the new one.
    const host = updateHost(marketplace, async () => { host.coreUnload() })
    const { app, plugin } = host
    plugin.onload(); await vi.advanceTimersByTimeAsync(0)
    // Loading the plugin asks Core for nothing; opening the outline does.
    expect(marketplace.loadCommunityPlugins).not.toHaveBeenCalled()
    const view = host.openView(); await vi.advanceTimersByTimeAsync(0)
    expect(marketplace.loadCommunityPlugins).toHaveBeenCalledOnce()
    expect(marketplace.getPluginNewestVersion).not.toHaveBeenCalled()
    const pill = view.containerEl.querySelector<HTMLButtonElement>('[data-action="update"]')!
    expect(pill.getAttribute('aria-label')).toBe('Update Outline View to 0.3.4')
    expect(updates.record).toMatchObject({ checkForUpdates: true, checked: { version: '0.3.4' } })

    const tab = host.openSettings(); await vi.advanceTimersByTimeAsync(0)
    // The settings page reuses this window's check: Core is not asked again.
    expect(marketplace.loadCommunityPlugins).toHaveBeenCalledOnce()
    expect(app.github.getReleaseInfo).toHaveBeenCalledOnce()
    expect(tab.containerEl.querySelector<HTMLInputElement>('input[data-update-setting="checkForUpdates"]')?.checked).toBe(true)
    expect(tab.containerEl.querySelector('[data-release-status]')?.textContent).toBe('Update available')
    const settingsPill = tab.containerEl.querySelector<HTMLButtonElement>('.outline-view-settings__masthead [data-action="update"]')!
    expect(settingsPill.textContent).toBe('Update to 0.3.4')

    pill.click()
    expect(dialogs()).toHaveLength(1)
    expect(dialogs()[0].textContent).toContain('Update Outline View from 0.3.2 to 0.3.4?')
    dialogButton('Cancel').click()
    expect(dialogs()).toHaveLength(0)
    expect(app.plugins.updatePlugin).not.toHaveBeenCalled()

    settingsPill.click()
    const release = dialogs()[0].querySelector('a')!
    release.click()
    expect(app.openLink).toHaveBeenCalledExactlyOnceWith('https://github.com/prisant-labs/typora-plugin-outline-view/releases/tag/0.3.4')
    dialogButton('Update').click(); await vi.advanceTimersByTimeAsync(0)
    expect(app.plugins.updatePlugin).toHaveBeenCalledExactlyOnceWith(ID)
    // Core's unload closed the dialog and the outline; nothing reappears.
    expect(dialogs()).toHaveLength(0)
    expect(view.containerEl.isConnected).toBe(false)
    await vi.advanceTimersByTimeAsync(1000)
    expect(document.querySelectorAll('.typ-modal__wrapper')).toHaveLength(0)
  })

  it('reports an update that Core did not start, without unloading', async () => {
    vi.useFakeTimers()
    updates.record = { checkForUpdates: false }
    const marketplace = {
      pluginList: [{ id: ID, newestVersion: '0.3.4' }] as unknown[],
      get isLoaded() { return true },
      getPlugin: vi.fn((id: string) => marketplace.pluginList.find(entry => (entry as { id: string }).id === id)),
      loadCommunityPlugins: vi.fn(async () => {}), getPluginNewestVersion: vi.fn(async () => '0.3.4'),
    }
    const host = updateHost(marketplace, async () => {})
    const { app, plugin } = host
    plugin.onload(); await vi.advanceTimersByTimeAsync(0)
    const view = host.openView(); await vi.advanceTimersByTimeAsync(0)
    host.openSettings(); await vi.advanceTimersByTimeAsync(0)
    // The setting is off, so neither Core nor GitHub is asked; Core's already-loaded data still shows the pill.
    expect(marketplace.loadCommunityPlugins).not.toHaveBeenCalled()
    expect(marketplace.getPluginNewestVersion).not.toHaveBeenCalled()
    expect(app.github.getReleaseInfo).not.toHaveBeenCalled()
    view.containerEl.querySelector<HTMLButtonElement>('[data-action="update"]')!.click()
    const dialog = dialogs()[0]
    dialogButton('Update').click()
    await vi.advanceTimersByTimeAsync(0)
    expect(app.plugins.updatePlugin).toHaveBeenCalledOnce()
    expect(dialog.textContent).toContain('Outline View was not updated.')
    host.coreUnload()
    expect(dialog.isConnected).toBe(false)
  })

  it('keeps the update setting out of Outline View\'s settings file', async () => {
    updates.record = { checkForUpdates: true }
    const host = updateHost({ getPlugin: () => undefined, loadCommunityPlugins: async () => {} }, async () => {})
    host.plugin.onload()
    const set = vi.spyOn(host.plugin.settings, 'set')
    const tab = host.openSettings()
    const box = tab.containerEl.querySelector<HTMLInputElement>('input[data-update-setting="checkForUpdates"]')!
    box.checked = false; box.dispatchEvent(new Event('change'))
    await vi.waitFor(() => expect(updates.record.checkForUpdates).toBe(false))
    expect(set).not.toHaveBeenCalled()
    expect(host.plugin.settings.get('checkForUpdates' as never)).toBeUndefined()
    host.coreUnload()
  })
})
