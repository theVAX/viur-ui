import { test, expect } from '@playwright/test'

// RecordBone sub-bones use mainformState.readonly (always false in CompareWrapper),
// so inner inputs are not disabled in the readonly variant. Disabled test is omitted.

const STORY_ID = 'stories-legacy-bones-recordbone-story-vue'
const DEFAULT_URL = `/__sandbox.html?storyId=${STORY_ID}&variantId=${STORY_ID}-0`

const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`RecordBone [${panel}]`, () => {

    test('feuert initial change-Event beim Mount', async ({ page }) => {
      await page.goto(DEFAULT_URL)
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      await expect(log).not.toBeEmpty()
    })

    test('event-log enthält boneName', async ({ page }) => {
      await page.goto(DEFAULT_URL)
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      await expect(log).toContainText('"address"')
    })

  })
}
