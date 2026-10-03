import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildUpdateConfirmation } from './update-confirmation'

afterEach(() => { document.body.replaceChildren() })

function build(overrides: Partial<Parameters<typeof buildUpdateConfirmation>[0]> = {}) {
  const options = { name: 'Outline View', installed: '0.3.2', version: '0.3.4', repo: 'prisant-labs/typora-plugin-outline-view', confirm: vi.fn(() => new Promise<void>(() => {})), close: vi.fn(), isOpen: vi.fn(() => true), ...overrides }
  const element = buildUpdateConfirmation(options); document.body.append(element)
  const button = (name: string) => [...element.querySelectorAll('button')].find(node => node.textContent === name)
  return { element, options, button }
}

describe('buildUpdateConfirmation', () => {
  it('says what the update does before anything happens', () => {
    const { element, options } = build()
    const text = element.textContent!
    expect(text).toContain('Update Outline View from 0.3.2 to 0.3.4?')
    expect(text).toContain('Community Plugin Core downloads the newest release from GitHub and reloads Outline View in this window.')
    expect(text).toContain('Your Outline View settings are kept.')
    expect(text).toContain('Other Typora windows keep 0.3.2 until you restart them.')
    expect(text).toContain('If the download fails, reinstall Outline View from the Plugin Marketplace. Your Outline View settings are still kept.')
    expect(text).not.toContain('Favorites')
    const link = element.querySelector('a')!
    expect(link.textContent).toBe('What\'s new in 0.3.4')
    expect(link.href).toBe('https://github.com/prisant-labs/typora-plugin-outline-view/releases/tag/0.3.4')
    expect(link.target).toBe('_blank'); expect(link.rel).toBe('noopener noreferrer')
    expect([...element.querySelectorAll('button')].map(node => node.textContent)).toEqual(['Update', 'Cancel'])
    expect(element.classList.contains('outline-view-update-confirmation')).toBe(true)
    expect(options.confirm).not.toHaveBeenCalled()
  })

  it('opens the release link through the host when it can', () => {
    const openLink = vi.fn()
    const { element } = build({ openLink })
    const link = element.querySelector('a')!
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    link.dispatchEvent(click)
    expect(click.defaultPrevented).toBe(true)
    expect(openLink).toHaveBeenCalledExactlyOnceWith('https://github.com/prisant-labs/typora-plugin-outline-view/releases/tag/0.3.4')
  })

  it('omits the release link without a GitHub repository', () => {
    for (const repo of [undefined, '', 'not a repo', 'https://example.com/a/b']) {
      expect(build({ repo }).element.querySelector('a')).toBeNull()
      document.body.replaceChildren()
    }
  })

  it('cancels without updating', () => {
    const { options, button } = build()
    button('Cancel')!.click()
    expect(options.close).toHaveBeenCalledOnce()
    expect(options.confirm).not.toHaveBeenCalled()
  })

  it('updates once, and stays open and busy while Core works', () => {
    const { element, options, button } = build()
    const update = button('Update')!
    update.click(); update.click()
    expect(options.confirm).toHaveBeenCalledOnce()
    expect(update.disabled).toBe(true); expect(button('Cancel')!.disabled).toBe(true)
    expect(element.querySelector('[role="status"]')!.textContent).toBe('Updating Outline View…')
    expect(options.close).not.toHaveBeenCalled()
  })

  it('reports an update that did not start, and offers Close', async () => {
    for (const confirm of [vi.fn(async () => {}), vi.fn(async () => { throw new Error('download failed') })]) {
      const { element, options, button } = build({ confirm })
      button('Update')!.click()
      await vi.waitFor(() => expect(element.querySelector('[role="status"]')!.textContent).toBe('Outline View was not updated. You can update it from Installed Plugins in Community Plugin options.'))
      expect(button('Update')).toBeUndefined()
      button('Close')!.click()
      expect(options.close).toHaveBeenCalledOnce()
      document.body.replaceChildren()
    }
  })

  it('says nothing once the dialog has closed', async () => {
    let finish!: () => void
    const isOpen = vi.fn(() => true)
    const { element, button } = build({ confirm: vi.fn(() => new Promise<void>(resolve => { finish = resolve })), isOpen })
    button('Update')!.click()
    isOpen.mockReturnValue(false); finish()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(element.querySelector('[role="status"]')!.textContent).toBe('Updating Outline View…')
  })
})
