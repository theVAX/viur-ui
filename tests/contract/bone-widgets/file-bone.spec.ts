import { test, expect } from '@playwright/test'

const STORY_ID = 'stories-legacy-bones-filebone-story-vue'
const DEFAULT_URL = `/__sandbox.html?storyId=${STORY_ID}&variantId=${STORY_ID}-0`

const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`FileBone [${panel}]`, () => {

    test('feuert initial change-Event beim Mount', async ({ page }) => {
      await page.goto(DEFAULT_URL)
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      await expect(log).not.toBeEmpty()
    })

    test('event-log enthält boneName', async ({ page }) => {
      await page.goto(DEFAULT_URL)
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      await expect(log).toContainText('"file"')
    })

  })
}
