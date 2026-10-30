import { expect, test } from '@playwright/test'

test('voice planning → live-edit, driven by sim mode', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto('/?fast=1')
  await page.screenshot({ path: 'test-results/screens/01-hero.png', fullPage: true })

  await page.getByRole('button', { name: 'Start' }).click()

  // itinerary builds with rich detail
  await expect(page.getByTestId('workspace')).toBeVisible()
  await expect(page.getByTestId('itinerary')).toBeVisible()
  await expect(page.getByText('Dinner at a local ramen house', { exact: true })).toBeVisible()
  await expect(page.getByText('Traditional tea-ceremony experience', { exact: true })).toBeVisible()
  // enrichment surfaced
  await expect(page.getByTestId('cost')).toBeVisible()
  await expect(page.getByTestId('packing')).toBeVisible()

  await page.screenshot({ path: 'test-results/screens/03-itinerary.png', fullPage: true })
  expect(errors, `console errors: ${errors.join('\n')}`).toEqual([])
})

test('post-sale (Cymbal Care): locate customer → change → pay, driven by sim', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto('/?fast=1')
  await page.getByRole('button', { name: 'Post-sale' }).click()
  await page.getByRole('button', { name: 'Start' }).click()

  // the dedicated support screen loads the caller + their live case
  await expect(page.getByTestId('postsale')).toBeVisible()
  await expect(page.getByTestId('care-customer')).toContainText('Vikas Mishra')
  await expect(page.getByTestId('care-customer')).toContainText('CYMBAL-7K2D')
  // the flight change + extra night are booked, then paid end-to-end on the authorized card
  await expect(page.getByTestId('pending-changes')).toContainText('Flight rebooked')
  await expect(page.getByTestId('pending-changes')).toContainText('Extra night')
  await expect(page.getByTestId('payment')).toContainText('Paid')
  await expect(page.getByTestId('payment')).toContainText('CYMBAL-')

  await page.screenshot({ path: 'test-results/screens/05-care.png', fullPage: true })
  expect(errors, `console errors: ${errors.join('\n')}`).toEqual([])
})

test('captures a planner screenshot mid-flow', async ({ page }) => {
  await page.goto('/?fast=0')
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByTestId('itinerary')).toBeVisible({ timeout: 20_000 })
  // wait for the plan to compose and cards to appear
  await expect(page.getByTestId('cost')).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(2500)
  // clicking a place focuses it on the real map and opens its listing there
  await page.getByText('Shibuya & Harajuku street walk').first().click()
  await expect(page.getByTestId('map-listing')).toBeVisible()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'test-results/screens/02-planner.png', fullPage: true })
})

test('architecture page renders', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Architecture' }).click()
  await expect(page.getByTestId('architecture')).toBeVisible()
  await expect(page.getByText(/agentic travel stack/i)).toBeVisible()
  await expect(page.getByText(/Gemini 3.8 Live/)).toBeVisible()
  await page.screenshot({ path: 'test-results/screens/04-architecture.png', fullPage: true })
})
