// Only the host SettingTab/SettingItem and in-memory settings services are
// adapted. Their DOM structure matches the pinned core; product UI is imported
// unchanged. Share this adapter with unit tests to avoid a second fake host.
export { SettingTab, Plugin, PluginSettings } from '../test/support/typora-core'
