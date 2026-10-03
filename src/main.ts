import './style.scss'

import { Plugin, PluginSettings } from '@typora-community-plugin/core'

import {
  OUTLINE_VIEW_TYPE,
  RightDockPlacement,
  type RightDockApp,
} from './placement/right-dock'
import { OutlineView } from './views/outline-view'
import {
  DEFAULT_OUTLINE_SETTINGS,
  type OutlineSettings,
} from './settings/model'
import { OutlineSettingsTab } from './settings/settings-tab'
import {
  openPluginSettings,
  relabelRightDockToggle,
} from './integration/community-plugin-ui'
import { UpdateNotifier, type PluginManagerLike } from './update/update-check'
import { openUpdateConfirmation } from './update/update-dialog'
import { UpdateStore } from './update/update-store'

const PRODUCT_NAME = 'Outline View'

interface OutlineViewActions {
  refresh(): void
  expandAll(): void
  collapseAll(): void
}

export default class OutlinePlugin extends Plugin<OutlineSettings> {
  private placement?: RightDockPlacement

  onload() {
    const settings = new PluginSettings<OutlineSettings>(
      this.app,
      this.manifest,
      { version: 1 },
    )
    settings.setDefault(DEFAULT_OUTLINE_SETTINGS)
    this.registerSettings(settings)

    // D025: Outline View reads Core's Marketplace data and calls Core's update; it never asks GitHub for updates itself.
    // The record lives in its own IndexedDB store, never in PluginSettings.
    const updateStore = new UpdateStore()
    const notifier = new UpdateNotifier({
      id: this.manifest.id,
      name: PRODUCT_NAME,
      installed: this.manifest.version,
      // Typed by Core, but checked at runtime: another Core version may lack a method.
      plugins: () => (this.app as unknown as { plugins?: PluginManagerLike }).plugins,
      store: updateStore,
    })
    let disposed = false
    let updateDialog: { close(): void } | undefined
    const openUpdate = () => {
      const version = notifier.state.version
      if (disposed || !version) return
      updateDialog?.close()
      updateDialog = openUpdateConfirmation({
        name: PRODUCT_NAME,
        installed: this.manifest.version,
        version,
        repo: this.manifest.repo,
        confirm: () => notifier.update(),
        openLink: typeof this.app.openLink === 'function' ? (href) => this.app.openLink(href) : undefined,
      })
    }
    const updates = {
      state: () => notifier.state,
      subscribe: (listener: () => void) => notifier.subscribe(listener),
      load: () => notifier.load(),
      open: openUpdate,
      setEnabled: (enabled: boolean) => notifier.setEnabled(enabled),
      check: () => { void notifier.check() },
    }

    const settingsTab = new OutlineSettingsTab(this, this.app, updates)
    this.registerSettingTab(settingsTab)
    this.register(() => settingsTab.onhide())
    this.register(relabelRightDockToggle())
    // Core's update uninstalls the running plugin first, which runs this before anything is downloaded.
    this.register(() => {
      disposed = true
      updateDialog?.close()
      notifier.dispose()
      void updateStore.close()
    })

    this.register(
      this.app.viewManager.registerView(
        OUTLINE_VIEW_TYPE,
        (leaf) =>
          new OutlineView(
            leaf,
            this.app,
            this.settings,
            () => openPluginSettings(this.app, this.manifest.name),
            updates,
          ),
      ),
    )

    this.placement = new RightDockPlacement(
      this.app as unknown as RightDockApp,
    )

    this.registerCommand({
      id: 'toggle',
      title: 'Toggle',
      scope: 'global',
      callback: () => this.placement?.toggle(),
    })

    this.registerCommand({
      id: 'refresh',
      title: 'Refresh',
      scope: 'global',
      callback: () => {
        this.placement?.open()
        this.placement?.getView<OutlineView>()?.refresh()
      },
    })

    this.registerCommand({
      id: 'expand-all',
      title: 'Expand All',
      scope: 'global',
      callback: () => {
        this.placement?.open()
        this.placement?.getView<OutlineViewActions>()?.expandAll()
      },
    })

    this.registerCommand({
      id: 'collapse-all',
      title: 'Collapse All',
      scope: 'global',
      callback: () => {
        this.placement?.open()
        this.placement?.getView<OutlineViewActions>()?.collapseAll()
      },
    })

    if (this.settings.get('autoOpen') === true) this.placement.open()
  }

  onunload() {
    this.placement?.dispose()
    this.placement = undefined
  }
}
