import { expect, it } from 'vitest'

it('keeps shared settings and preview live after repeated browser history restorations', async () => {
  document.body.innerHTML = '<select id="prototype-theme"><option value="dark">Dark</option></select><select id="prototype-width"><option value="narrow">Narrow</option></select><select id="prototype-document"><option value="empty">Empty</option></select><button id="prototype-reset">Reset</button><div class="prototype-window"><main id="settings-mount"></main></div><div id="write" hidden></div>'
  await import('./main')
  expect(document.querySelectorAll('#write > *')).toHaveLength(57)
  expect(document.querySelector('#write > h1')!.textContent).toBe('h1. Harbor House Community Knowledge Hub')
  const changeSize = (value: string) => {
    const size = document.querySelector<HTMLInputElement>('[data-appearance-level="1"] [data-field="size"]')!
    size.value = value
    size.dispatchEvent(new Event('input'))
  }
  const previewSize = () => document.querySelector<HTMLElement>('.outline-view--preview [data-heading-level="1"]')!.parentElement!.style.fontSize
  changeSize('150')
  expect(previewSize()).toBe('150%')
  for (const value of ['175', '200']) {
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
    changeSize(value)
    expect(previewSize()).toBe(value + '%')
    expect(document.querySelectorAll('.outline-view-settings__nav')).toHaveLength(1)
  }
  document.querySelector<HTMLButtonElement>('#prototype-reset')!.click()
  expect(previewSize()).toBe('100%')
  document.querySelector<HTMLSelectElement>('#prototype-document')!.dispatchEvent(new Event('change'))
  expect(document.querySelector('.outline-view-settings__preview')!.textContent).toContain('Sample outline')
  window.dispatchEvent(new PageTransitionEvent('pagehide'))
  document.body.replaceChildren()
})
