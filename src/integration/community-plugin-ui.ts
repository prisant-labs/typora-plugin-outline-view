interface SettingsCommandApp {
  commands: {
    run(commandId: string): void
  }
}

const OUTLINE_DOCK_HINT = 'Toggle outline sidebar'

export function openPluginSettings(
  app: SettingsCommandApp,
  pluginName: string,
  root: ParentNode = document,
) {
  app.commands.run('settings:open')

  const tab = Array.from(
    root.querySelectorAll<HTMLElement>(
      '.typ-settings-modal .typ-nav__item[data-name]',
    ),
  ).find(({ dataset }) => dataset.name === pluginName)
  tab?.click()
}

export function relabelRightDockToggle(root: ParentNode = document) {
  const toggle = Array.from(
    root.querySelectorAll<HTMLElement>(
      'footer.ty-footer .footer-item-right[ty-hint]',
    ),
  ).find((item) => item.querySelector('.fa-align-right'))
  if (!toggle) return () => undefined

  const originalHint = toggle.getAttribute('ty-hint')
  const originalLabel = toggle.getAttribute('aria-label')
  toggle.setAttribute('ty-hint', OUTLINE_DOCK_HINT)
  toggle.setAttribute('aria-label', OUTLINE_DOCK_HINT)

  return () => {
    if (originalHint === null) toggle.removeAttribute('ty-hint')
    else toggle.setAttribute('ty-hint', originalHint)

    if (originalLabel === null) toggle.removeAttribute('aria-label')
    else toggle.setAttribute('aria-label', originalLabel)
  }
}
