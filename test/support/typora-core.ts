export class TestComponent {
  private disposables: Array<() => void> = []

  register(disposable: () => void) {
    this.disposables.push(disposable)
  }

  unload() {
    this.disposables.forEach((dispose) => dispose())
    this.disposables = []
  }
}

export class WorkspaceView extends TestComponent {
  constructor(public leaf: unknown) {
    super()
  }
}

type Listener = (key: string | string[], value: unknown) => void

export class TestStore<T extends Record<string, any>> {
  protected data = {} as T
  private listeners = new Map<string, Set<Listener>>()

  setDefault(defaults: T) {
    this.data = { ...defaults, ...this.data }
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.data[key]
  }

  set<K extends keyof T>(key: K, value: T[K]) {
    if (this.data[key] === value) return
    this.data[key] = value
    this.listeners.get(String(key))?.forEach((listener) => listener(String(key), value))
    this.listeners.get('*')?.forEach((listener) => listener(String(key), value))
  }

  onChange<K extends keyof T>(key: K | '*', listener: Listener) {
    const name = String(key)
    const listeners = this.listeners.get(name) ?? new Set<Listener>()
    listeners.add(listener)
    this.listeners.set(name, listeners)
    return () => listeners.delete(listener)
  }
}

export class PluginSettings<
  T extends Record<string, any>,
> extends TestStore<T> {
  filename: string
  version: number

  constructor(
    _app: unknown,
    manifest: { id?: string; __settings?: Partial<T> },
    options: { version: number },
  ) {
    super()
    this.data = { ...(manifest.__settings ?? {}) } as T
    this.filename = `data/${manifest.id}`
    this.version = options.version
  }

  load() {}
}

export class SettingItem {
  containerEl = document.createElement('div')
  info = document.createElement('div')
  name = document.createElement('div')
  controlsPrefix = document.createElement('div')
  controls = document.createElement('div')

  constructor() {
    this.containerEl.className = 'typ-setting-item'
    this.info.className = 'typ-setting-info'
    this.controlsPrefix.className = 'typ-setting-controls prefix'
    this.controls.className = 'typ-setting-controls postfix'
    this.containerEl.append(this.controlsPrefix, this.info, this.controls)
  }

  addTitle(text: string) {
    const title = document.createElement('h3')
    title.className = 'typ-setting-title'
    title.textContent = text
    this.info.append(title)
  }

  addName(text: string) {
    this.name.className = 'typ-setting-name'
    this.name.textContent = text
    this.info.append(this.name)
  }

  addDescription(text: string | ((element: HTMLElement) => void)) {
    const description = document.createElement('div')
    description.className = 'typ-setting-description'
    if (typeof text === 'string') description.textContent = text
    else text(description)
    this.info.append(description)
  }

  addCheckbox(build: (checkbox: HTMLInputElement) => void) {
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    build(checkbox)
    this.controlsPrefix.append(checkbox)
  }

  addSelect(build: (select: HTMLSelectElement) => void) {
    const select = document.createElement('select')
    build(select)
    this.controls.append(select)
  }
}

export class SettingTab {
  containerEl = document.createElement('div')

  constructor() {
    this.containerEl.className = 'typ-setting-tab'
  }

  addSettingTitle(text: string) {
    this.addSetting((setting) => setting.addTitle(text))
  }

  addSetting(build: (setting: SettingItem) => void) {
    const setting = new SettingItem()
    build(setting)
    this.containerEl.append(setting.containerEl)
  }

  onshow() {}
}

export class Plugin<T extends Record<string, any> = {}> extends TestComponent {
  registeredCommands: unknown[] = []
  registeredSettingTabs: unknown[] = []
  private registeredSettings?: PluginSettings<T>

  constructor(
    protected app: unknown,
    public manifest: unknown,
  ) {
    super()
  }

  registerCommand(command: unknown) {
    this.registeredCommands.push(command)
  }

  registerSettings(settings: PluginSettings<T>) {
    this.registeredSettings = settings
    settings.load()
  }

  get settings() {
    if (!this.registeredSettings) throw new Error('Settings are not registered')
    return this.registeredSettings
  }

  registerSettingTab(tab: unknown) {
    this.registeredSettingTabs.push(tab)
  }
}
