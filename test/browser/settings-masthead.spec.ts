import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from '@playwright/test'

test('section navigation keeps the masthead visible inside the settings scrollport', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto(pathToFileURL(resolve('docs/prototype/settings.html')).href)
  await expect(page.locator('html')).toHaveAttribute('data-prototype-ready', 'true')

  for (const section of ['Behavior', 'Structure', 'Appearance', 'Selector', 'Heading styles']) {
    await page.locator('.outline-view-settings__nav').getByRole('link', { name: section }).click()

    const geometry = await page.evaluate(() => {
      const scroll = document.querySelector<HTMLElement>('#settings-mount')!
      const masthead = document.querySelector<HTMLElement>('.outline-view-settings__masthead')!
      const nav = document.querySelector<HTMLElement>('.outline-view-settings__nav')!
      const viewport = scroll.getBoundingClientRect()
      const active = document.querySelector<HTMLElement>('.outline-view-settings__nav [aria-current]')!
      const title = document.querySelector<HTMLElement>(active.getAttribute('href')! + ' .typ-setting-title')!.getBoundingClientRect()
      return {
        scrollTop: scroll.scrollTop,
        viewportTop: viewport.top,
        mastheadTop: masthead.getBoundingClientRect().top,
        mastheadBottom: masthead.getBoundingClientRect().bottom,
        navTop: nav.getBoundingClientRect().top,
        navBottom: nav.getBoundingClientRect().bottom,
        titleTop: title.top,
      }
    })

    expect(geometry.scrollTop, section).toBeGreaterThan(0)
    expect(geometry.mastheadTop, section).toBeGreaterThanOrEqual(geometry.viewportTop - 1)
    expect(geometry.mastheadBottom, section).toBeLessThanOrEqual(geometry.navTop + 1)
    expect(geometry.navBottom, section).toBeLessThan(geometry.titleTop)
  }
})

test('narrow settings keep the sticky preview below the masthead and selected section visible', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto(pathToFileURL(resolve('docs/prototype/settings.html')).href)
  await expect(page.locator('html')).toHaveAttribute('data-prototype-ready', 'true')
  await page.locator('#prototype-width').selectOption('narrow')

  await page.locator('.outline-view-settings__nav').getByRole('link', { name: 'Heading styles' }).click()

  const geometry = await page.evaluate(() => {
    const scroll = document.querySelector<HTMLElement>('#settings-mount')!
    const masthead = document.querySelector<HTMLElement>('.outline-view-settings__masthead')!.getBoundingClientRect()
    const nav = document.querySelector<HTMLElement>('.outline-view-settings__nav')!.getBoundingClientRect()
    const preview = document.querySelector<HTMLElement>('.outline-view-settings__preview')!.getBoundingClientRect()
    const title = document.querySelector<HTMLElement>('#outline-settings-heading-styles .typ-setting-title')!.getBoundingClientRect()
    return { scrollTop: scroll.scrollTop, viewportTop: scroll.getBoundingClientRect().top, masthead, nav, preview, title }
  })

  expect(geometry.scrollTop).toBeGreaterThan(0)
  expect(geometry.masthead.top).toBeGreaterThanOrEqual(geometry.viewportTop - 1)
  expect(geometry.nav.top).toBeGreaterThanOrEqual(geometry.masthead.bottom - 1)
  expect(geometry.preview.top).toBeGreaterThanOrEqual(geometry.nav.bottom - 1)
  expect(geometry.title.top).toBeGreaterThanOrEqual(geometry.preview.bottom - 1)
})
