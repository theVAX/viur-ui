import { test, expect } from '@playwright/test'

// KeyBone is always readonly (fixture has readonly: true), so change-internal is never emitted.
// Tests verify the widget renders in its expected disabled/readonly state.

const STORY_ID = 'stories-legacy-bones-keybone-story-vue'
const DEFAULT_URL = `/__sandbox.html?storyId=${STORY_ID}&variantId=${STORY_ID}-0`

const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`KeyBone [${panel}]`, () => {

    test('widget ist immer disabled (readonly)', async ({ page }) => {
      await page.goto(DEFAULT_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      await expect(panelEl.locator('.widget-bone').first()).toHaveAttribute('disabled', '')
    })

    test('zeigt den Key-Wert an', async ({ page }) => {
      await page.goto(DEFAULT_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      await expect(panelEl.locator('input').first()).toBeVisible()
    })

  })
}
