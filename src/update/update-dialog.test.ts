import { afterEach, describe, expect, it, vi } from 'vitest'
import { openUpdateConfirmation } from './update-dialog'

afterEach(() => { document.body.replaceChildren() })

function open(overrides: Partial<Parameters<typeof openUpdateConfirmation>[0]> = {}) {
  const opener = document.createElement('button'); opener.textContent = 'pill'; document.body.append(opener); opener.focus()
  const dialog = openUpdateConfirmation({ name: 'Outline View', installed: '0.3.2', version: '0.3.4', repo: 'prisant-labs/typora-plugin-outline-view', confirm: vi.fn(async () => {}), ...overrides })
  const wrapper = document.querySelector<HTMLElement>('.typ-modal__wrapper')!
  const button = (name: string) => [...wrapper.querySelectorAll('button')].find(node => node.textContent === name)!
  return { opener, dialog, wrapper, button }
}

describe('openUpdateConfirmation', () => {
  it('focuses Cancel, so Escape and Enter act on the dialog and not on what opened it', () => {
    const { button, wrapper } = open()
    expect(document.activeElement).toBe(button('Cancel'))
    expect(wrapper.style.display).toBe('')
  })

  it('returns focus to the pill and removes the dialog when it closes', () => {
    const { opener, wrapper, button } = open()
    button('Cancel').click()
    expect(document.activeElement).toBe(opener)
    expect(wrapper.isConnected).toBe(false)
  })

  it('removes the dialog when the plugin closes it during an update', () => {
    const { opener, dialog, wrapper } = open()
    opener.remove(); dialog.close()
    expect(wrapper.isConnected).toBe(false)
    expect(document.activeElement).toBe(document.body)
  })

  it('opens the release link through the host', () => {
    const openLink = vi.fn()
    const { wrapper } = open({ openLink })
    wrapper.querySelector('a')!.click()
    expect(openLink).toHaveBeenCalledOnce()
  })
})
