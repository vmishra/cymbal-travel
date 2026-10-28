import { expect, test } from '@playwright/test'

test('voice planning → live-edit → post-sale, driven by sim mode', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto('/?fast=1')
  await page.screenshot({ path: 'test-results/screens/01-hero.png', fullPage: true })

  await page.getByRole('button', { name: 'Start' }).click()

  // itinerary builds with rich detail
  await expect(page.getByTestId('workspace')).toBeVisible()
  await expect(page.getByTestId('itinerary')).toBeVisible()
  await expect(page.getByText('Dinner at a local ramen house')).toBeVisible()
  await expect(page.getByText('Traditional tea-ceremony experience')).toBeVisible()
  // enrichment surfaced
  await expect(page.getByTestId('cost')).toBeVisible()
  await expect(page.getByTestId('packing')).toBeVisible()

  // post-sale: flight rescheduled + booked end-to-end
  await expect(page.getByText(/Flight booked/)).toBeVisible()

  await page.screenshot({ path: 'test-results/screens/03-postsale.png', fullPage: true })
  expect(errors, `console errors: ${errors.join('\n')}`).toEqual([])
})

test('captures a planner screenshot mid-flow', async ({ page }) => {
  await page.goto('/?fast=0')
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByTestId('itinerary')).toBeVisible({ timeout: 20_000 })
  // wait for the plan to compose and cards to appear
  await expect(page.getByTestId('cost')).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'test-results/screens/02-planner.png', fullPage: true })
})

test('architecture page renders', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Architecture' }).click()
  await expect(page.getByTestId('architecture')).toBeVisible()
  await expect(page.getByText(/Build an agentic travel planner/)).toBeVisible()
  await expect(page.getByText('Gemini 3.8 Live — speech-to-speech')).toBeVisible()
  await page.screenshot({ path: 'test-results/screens/04-architecture.png', fullPage: true })
})
