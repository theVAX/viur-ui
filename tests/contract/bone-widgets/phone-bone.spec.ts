import { test, expect } from '@playwright/test'

// PhoneBone has a country-code select before the phone input; @change fires on blur, not keyup.
// Disabled test targets input[type="tel"] specifically to avoid the country-code select input.

const STORY_ID = 'stories-legacy-bones-phonebone-story-vue'
const DEFAULT_URL = `/__sandbox.html?storyId=${STORY_ID}&variantId=${STORY_ID}-0`
const READONLY_URL = `/__sandbox.html?storyId=${STORY_ID}&variantId=${STORY_ID}-1`

const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`PhoneBone [${panel}]`, () => {

    test('feuert initial change-Event beim Mount', async ({ page }) => {
      await page.goto(DEFAULT_URL)
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      await expect(log).not.toBeEmpty()
    })

    test('phone-input ist disabled bei readonly', async ({ page }) => {
      await page.goto(READONLY_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      await expect(panelEl.locator('input[type="tel"]').first()).toBeDisabled()
    })

    test('event-log enthält boneName', async ({ page }) => {
      await page.goto(DEFAULT_URL)
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      await expect(log).toContainText('"phone"')
    })

  })
}
