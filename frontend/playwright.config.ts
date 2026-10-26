import { defineConfig, devices } from '@playwright/test'

// Builds the frontend, then serves it (and the sim WebSocket) from the FastAPI
// backend on :8470. Tests drive the app in credential-free sim mode.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:8470',
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && cd ../backend && PORT=8470 .venv/bin/python -m app.main',
    url: 'http://localhost:8470/api/health',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
