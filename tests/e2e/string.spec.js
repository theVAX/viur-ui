import { test, expect } from '@playwright/test'

test.describe('StringBone', () => {
  test('Input ist sichtbar', async ({ page }) => {
    await page.goto('/iframe.html?id=bones-stringbone--default&viewMode=story')
    await expect(page.locator('wa-input')).toBeVisible()
  })

  test('Input ist disabled im Readonly-Modus', async ({ page }) => {
    await page.goto('/iframe.html?id=bones-stringbone--readonly&viewMode=story')
    await expect(page.locator('wa-input')).toHaveAttribute('disabled')
  })
})
