import { test, expect } from '@playwright/test'

const STORY_ID = 'stories-legacy-bones-emailbone-story-vue'
const DEFAULT_URL = `/__sandbox.html?storyId=${STORY_ID}&variantId=${STORY_ID}-0`
const READONLY_URL = `/__sandbox.html?storyId=${STORY_ID}&variantId=${STORY_ID}-1`

const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`EmailBone [${panel}]`, () => {

    test('feuert initial change-Event beim Mount', async ({ page }) => {
      await page.goto(DEFAULT_URL)
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      await expect(log).not.toBeEmpty()
    })

    test('feuert change-Event beim Tippen', async ({ page }) => {
      await page.goto(DEFAULT_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      await panelEl.locator('input').click()
      await panelEl.locator('input').pressSequentially('xyz')
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      await expect(log).toContainText('xyz')
    })

    test('input ist disabled bei readonly', async ({ page }) => {
      await page.goto(READONLY_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      await expect(panelEl.locator('input').first()).toBeDisabled()
    })

    test('event-log enthält boneName', async ({ page }) => {
      await page.goto(DEFAULT_URL)
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      await expect(log).toContainText('"email"')
    })

  })
}
