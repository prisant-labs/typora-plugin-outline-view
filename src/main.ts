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
    this.registerSettingTab(new OutlineSettingsTab(this))
    this.register(relabelRightDockToggle())

    this.register(
      this.app.viewManager.registerView(
        OUTLINE_VIEW_TYPE,
        (leaf) =>
          new OutlineView(leaf, this.app, this.settings, () =>
            openPluginSettings(this.app, this.manifest.name),
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
