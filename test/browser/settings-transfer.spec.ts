import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from '@playwright/test'

const prototype = pathToFileURL(resolve('docs/prototype/settings.html')).href

test('a saved settings file downloads under its name and imports back, with undo', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto(prototype)
  await expect(page.locator('html')).toHaveAttribute('data-prototype-ready', 'true')

  const density = page.locator('[data-setting="density"]')
  await density.selectOption('compact')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('[data-action="save-settings-file"]').click(),
  ])
  expect(download.suggestedFilename()).toBe('outline-view-settings.json')
  const saved = await download.path()
  const file = JSON.parse(await readFile(saved, 'utf8'))
  expect(file.schema).toBe(1)
  expect(file.settings.density).toBe('compact')

  await density.selectOption('comfortable')
  await page.locator('[data-transfer-picker]').setInputFiles({
    name: 'outline-view-settings.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(file)),
  })
  await expect(page.locator('[data-transfer-status]')).toHaveText('Imported the settings.')
  await expect(density).toHaveValue('compact')

  await page.locator('[data-action="undo-settings-import"]').click()
  await expect(density).toHaveValue('comfortable')
})

test('pasted JSON imports, and a bad paste changes nothing', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto(prototype)
  await expect(page.locator('html')).toHaveAttribute('data-prototype-ready', 'true')

  const box = page.locator('[data-transfer-input]')
  const density = page.locator('[data-setting="density"]')
  await box.fill('{ not json')
  await page.locator('[data-action="import-pasted-settings"]').click()
  await expect(page.locator('[data-transfer-error]')).toContainText('Your settings have not changed.')
  await expect(density).toHaveValue('comfortable')

  await box.fill(JSON.stringify({ plugin: 'prisant-labs.outline-view', schema: 1, settings: { density: 'compact' } }))
  await page.locator('[data-action="import-pasted-settings"]').click()
  await expect(density).toHaveValue('compact')
  await expect(page.locator('[data-transfer-error]')).toBeHidden()
  await expect(box).toHaveValue('')
})

test('the section stays inside a narrow settings page', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto(prototype)
  await expect(page.locator('html')).toHaveAttribute('data-prototype-ready', 'true')
  await page.locator('#prototype-width').selectOption('narrow')

  const box = page.locator('[data-transfer-input]')
  const row = box.locator('xpath=ancestor::*[contains(@class, "typ-setting-item")]')
  const [boxBounds, rowBounds] = await Promise.all([box.boundingBox(), row.boundingBox()])
  expect(boxBounds!.x + boxBounds!.width).toBeLessThanOrEqual(rowBounds!.x + rowBounds!.width + 1)
})
