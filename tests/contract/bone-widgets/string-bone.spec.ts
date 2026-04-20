import { test, expect } from '@playwright/test'

const STORY_ID = 'stories-legacy-bones-stringbone-story-vue'
const DEFAULT_URL = `/__sandbox.html?storyId=${STORY_ID}&variantId=${STORY_ID}-0`
const READONLY_URL = `/__sandbox.html?storyId=${STORY_ID}&variantId=${STORY_ID}-1`

const panels = ['legacy', 'new'] as const

for (const panel of panels) {
  test.describe(`StringBone [${panel}]`, () => {

    test('feuert initial change-Event beim Mount', async ({ page }) => {
      await page.goto(DEFAULT_URL)
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      await expect(log).not.toBeEmpty()
    })

    test('feuert change-Event beim Tippen', async ({ page }) => {
      await page.goto(DEFAULT_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      await panelEl.locator('input').click()
      await panelEl.locator('input').pressSequentially('Testinhalt')
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      await expect(log).toContainText('Testinhalt')
    })

    test('input ist disabled bei readonly', async ({ page }) => {
      await page.goto(READONLY_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      const input = panelEl.locator('input')
      await expect(input).toBeDisabled()
    })

    test('event-log enthält boneName als erstes Argument', async ({ page }) => {
      await page.goto(DEFAULT_URL)
      const panelEl = page.locator(`[data-testid="${panel}-panel"]`)
      await panelEl.locator('input').click()
      await panelEl.locator('input').pressSequentially('x')
      const log = page.locator(`[data-testid="${panel}-event-log"]`)
      await expect(log).toContainText('"title"')
    })

  })
}
