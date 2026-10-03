import { afterAll, expect, it, vi } from 'vitest'
import manifest from '../src/manifest.json'

afterAll(() => {
  window.dispatchEvent(new PageTransitionEvent('pagehide'))
  document.body.replaceChildren()
})

it('keeps shared settings and preview live after repeated browser history restorations', async () => {
  document.body.innerHTML = '<select id="prototype-theme"><option value="dark">Dark</option></select><select id="prototype-width"><option value="narrow">Narrow</option></select><select id="prototype-document"><option value="empty">Empty</option></select><select id="prototype-updates"><option value="up-to-date">Up to date</option><option value="update-available">Update available</option></select><button id="prototype-reset">Reset</button><p id="prototype-status"></p><div class="prototype-window"><main id="settings-mount"></main></div><dialog id="update-dialog"><div id="update-mount"></div></dialog><div id="write" hidden></div>'
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
})

it('simulates an available update with the settings pill and the production confirmation in a native dialog', async () => {
  const next = manifest.version.replace(/\d+$/, patch => String(Number(patch) + 1))
  const dialog = document.querySelector<HTMLDialogElement>('#update-dialog')!
  // jsdom reflects `open` but does not implement the modal methods.
  dialog.showModal = () => { dialog.open = true }
  dialog.close = () => { dialog.open = false }
  const releaseStatus = () => document.querySelector<HTMLElement>('.outline-view-settings__release-status')!

  await vi.waitFor(() => expect(releaseStatus().dataset.state).toBe('current'))
  expect(document.querySelector('.outline-view-settings__update')).toBeNull()

  const scenario = document.querySelector<HTMLSelectElement>('#prototype-updates')!
  scenario.value = 'update-available'
  scenario.dispatchEvent(new Event('change'))
  await vi.waitFor(() => expect(releaseStatus().dataset.state).toBe('update'))
  const pill = document.querySelector<HTMLButtonElement>('.outline-view-settings__update')!
  expect(pill.textContent).toBe(`Update to ${next}`)

  pill.click()
  expect(dialog.open).toBe(true)
  expect(dialog.textContent).toContain(`Update Outline View from ${manifest.version} to ${next}?`)
  dialog.querySelector<HTMLButtonElement>('[data-action="confirm-update"]')!.click()
  expect(dialog.open).toBe(false)
  expect(document.querySelector('#prototype-status')!.textContent).toContain(`installs ${next}`)

  // With checks off, nothing is requested, but what Core's Marketplace already holds still shows (D025, OV-D3).
  const check = document.querySelector<HTMLInputElement>('[data-update-setting="checkForUpdates"]')!
  check.checked = false
  check.dispatchEvent(new Event('change'))
  await vi.waitFor(() => expect(document.querySelector('[data-current-version]')!.textContent).toBe('Unavailable'))
  expect(releaseStatus().textContent).toBe('Update available')
  expect(document.querySelector('.outline-view-settings__update')).not.toBeNull()

  scenario.value = 'up-to-date'
  scenario.dispatchEvent(new Event('change'))
  await vi.waitFor(() => expect(releaseStatus().textContent).toBe('Not checked'))
  expect(document.querySelector('.outline-view-settings__update')).toBeNull()
})
