import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from '@playwright/test'

test('section navigation keeps the masthead visible inside the settings scrollport', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto(pathToFileURL(resolve('docs/prototype/settings.html')).href)
  await expect(page.locator('html')).toHaveAttribute('data-prototype-ready', 'true')

  const sections = [
    ['Behavior', 'behavior'], ['Structure', 'structure'], ['Appearance', 'appearance'],
    ['Selector', 'selector'], ['Heading styles', 'heading-styles'],
  ] as const
  for (const [label, slug] of sections) {
    const link = page.locator('.outline-view-settings__nav').getByRole('link', { name: label })
    await link.click()
    await expect(link).toHaveAttribute('aria-current', 'location')

    const geometry = await page.evaluate((targetId) => {
      const scroll = document.querySelector<HTMLElement>('#settings-mount')!
      const masthead = document.querySelector<HTMLElement>('.outline-view-settings__masthead')!
      const nav = document.querySelector<HTMLElement>('.outline-view-settings__nav')!
      const viewport = scroll.getBoundingClientRect()
      const title = document.querySelector<HTMLElement>(`#outline-settings-${targetId} .typ-setting-title`)!.getBoundingClientRect()
      return {
        scrollTop: scroll.scrollTop,
        viewportTop: viewport.top,
        mastheadTop: masthead.getBoundingClientRect().top,
        mastheadBottom: masthead.getBoundingClientRect().bottom,
        navTop: nav.getBoundingClientRect().top,
        navBottom: nav.getBoundingClientRect().bottom,
        titleTop: title.top,
      }
    }, slug)

    expect(geometry.scrollTop, label).toBeGreaterThan(0)
    expect(geometry.mastheadTop, label).toBeGreaterThanOrEqual(geometry.viewportTop - 1)
    expect(geometry.mastheadBottom, label).toBeLessThanOrEqual(geometry.navTop + 1)
    expect(geometry.navBottom, label).toBeLessThan(geometry.titleTop)
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
