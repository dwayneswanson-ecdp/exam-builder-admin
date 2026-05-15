// @ts-check
import { defineConfig, devices } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load .env.test into process.env (no dotenv dependency required)
const envFile = resolve(process.cwd(), '.env.test');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir:       './tests',
  globalSetup:   './tests/global-setup.ts',
  fullyParallel: false,           // sequential — tests share a live DB
  forbidOnly:    !!process.env.CI,
  retries:       process.env.CI ? 1 : 0,
  workers:       1,               // 1 worker avoids Supabase rate-limit collisions
  reporter:      [['html'], ['list']],
  outputDir:     './tests/screenshots',

  use: {
    baseURL:    BASE_URL,
    trace:      'on-first-retry',
    screenshot: 'only-on-failure',
    video:      'off',
  },

  /* Run only against Chromium by default to keep the suite fast.
     Uncomment the other projects when you need cross-browser coverage. */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Auto-start a static file server so tests don't need one running manually. */
  webServer: {
    command:            'npx serve . -p 3000 --no-clipboard',
    url:                BASE_URL,
    reuseExistingServer: true,
    timeout:            10_000,
  },
});

