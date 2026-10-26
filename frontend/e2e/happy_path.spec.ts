import { expect, test } from '@playwright/test'

test('voice planning → live-edit → post-sale, driven by sim mode', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto('/?fast=1')
  // hero before start
  await page.screenshot({ path: 'test-results/screens/01-hero.png', fullPage: true })

  await page.getByRole('button', { name: 'Start' }).click()

  // itinerary materializes and the orchestration completes
  await expect(page.getByTestId('workspace')).toBeVisible()
  await expect(page.locator('[data-agent="Flights"]')).toHaveAttribute('data-status', 'done')
  await expect(page.locator('[data-agent="Events"]')).toHaveAttribute('data-status', 'done')

  // live-edit beats
  await expect(page.getByText('Dinner at a local ramen house')).toBeVisible()
  await expect(page.getByText('Traditional tea-ceremony experience')).toBeVisible()

  // post-sale: mode flips, disruption handled, rebooked
  await expect(page.getByTestId('postsale')).toBeVisible()
  await expect(page.getByText('Flight rebooked')).toBeVisible()

  await page.screenshot({ path: 'test-results/screens/03-postsale.png', fullPage: true })
  expect(errors, `console errors: ${errors.join('\n')}`).toEqual([])
})

test('captures a planner screenshot mid-flow', async ({ page }) => {
  await page.goto('/?fast=0')
  await page.getByRole('button', { name: 'Start' }).click()
  // after the orchestration completes but before post-sale
  await expect(page.locator('[data-agent="Events"]')).toHaveAttribute('data-status', 'done', { timeout: 20_000 })
  await expect(page.getByTestId('itinerary')).toBeVisible()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'test-results/screens/02-planner.png', fullPage: true })
})
