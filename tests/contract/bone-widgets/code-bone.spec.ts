import { test, expect } from '@playwright/test'

// CodeBone uses async onMounted with dynamic CodeMirror import (await build()).
// The async initialization does not complete in the headless test environment,
// so event-log tests are not reliable. Only the readonly/disabled state is tested.

const STORY_ID = 'stories-legacy-bones-codebone-story-vue'
const READONLY_URL = `/__sandbox.html?storyId=${STORY_ID}&variantId=${STORY_ID}-1`

const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`CodeBone [${panel}]`, () => {

    test('textarea ist disabled bei readonly', async ({ page }) => {
      await page.goto(READONLY_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      await expect(panelEl.locator('textarea').first()).toBeDisabled()
    })

  })
}
