import { test, expect } from '@playwright/test'

test.describe('BooleanBone', () => {
  test('Switch ist sichtbar', async ({ page }) => {
    await page.goto('/iframe.html?id=bones-booleanbone--default&viewMode=story')
    await expect(page.locator('wa-switch')).toBeVisible()
  })

  test('Switch hat disabled-Attribut im Readonly-Modus', async ({ page }) => {
    await page.goto('/iframe.html?id=bones-booleanbone--readonly&viewMode=story')
    await expect(page.locator('wa-switch')).toHaveAttribute('disabled')
  })

  test('User kann Switch aktivieren', async ({ page }) => {
    await page.goto('/iframe.html?id=bones-booleanbone--default&viewMode=story')
    const sw = page.locator('wa-switch')
    await sw.click()
    await expect(sw).toHaveAttribute('checked')
  })
})
