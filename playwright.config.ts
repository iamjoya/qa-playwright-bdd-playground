import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig }        from 'playwright-bdd';
import * as fs                    from 'fs';
import * as path                  from 'path';

// ── Load .env file before anything else ──────────────────────────────────────
import 'dotenv/config';

// ── Load environment config (resolves ${VAR} refs at import time) ─────────────
// Intentionally loaded here so playwright.config.ts fails fast if misconfigured.
import { ConfigHelper } from './src/helpers/ConfigHelper';
const appConfig = ConfigHelper.getConfig();

// ── Load visual regression settings ─────────────────────────────────────────
const visualConfigPath = path.resolve(__dirname, 'config/visual.config.json');
const visualConfig = JSON.parse(fs.readFileSync(visualConfigPath, 'utf-8')) as {
  threshold:     number;
  maxDiffPixels: number;
  animations:    'disabled' | 'allow';
  fullPage:      boolean;
};

// ── BDD config ────────────────────────────────────────────────────────────────
// In playwright-bdd v8, defineBddConfig() returns the absolute path to the
// output directory (a string), not a config object. Use it directly as testDir.
const bddTestDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps:    ['src/fixtures/index.ts', 'src/steps/**/*.ts'],
  outputDir: '.bdd-generated',
});

// ── Active test environment ───────────────────────────────────────────────────
const testEnv = process.env.TEST_ENV ?? 'dev';

export default defineConfig({
  // ── Snapshot directory — per-environment baselines never overwrite each other
  snapshotDir: `snapshots/${testEnv}`,

  // ── Global test settings ───────────────────────────────────────────────────
  testDir: bddTestDir,
  fullyParallel:      true,
  forbidOnly:         !!process.env.CI,
  retries:            process.env.CI ? 2 : 0,
  workers:            process.env.CI ? '100%' : undefined,
  timeout:            60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      threshold:     visualConfig.threshold,
      maxDiffPixels: visualConfig.maxDiffPixels,
      animations:    visualConfig.animations,
    },
  },

  // ── Allure reporter — sole reporting tool ──────────────────────────────────
  reporter: [
    ['allure-playwright', { resultsDir: 'allure-results', detail: true }],
    ...(process.env.CI ? [] : [['list'] as ['list']]),
  ],

  // ── Shared browser defaults ────────────────────────────────────────────────
  use: {
    baseURL:           appConfig.baseUrl,
    headless:          true,
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
    trace:             'retain-on-failure',
    actionTimeout:     15_000,
    navigationTimeout: 60_000,
  },

  // ── Projects ───────────────────────────────────────────────────────────────
  projects: [
    {
      name: 'ui-chrome',
      use:  { ...devices['Desktop Chrome'] },
      grep:       /@ui/,
      grepInvert: /@visual/,   // visual scenarios run only in the visual project
    },
    {
      name: 'api',
      use:  {
        // API tests don't launch a browser; Playwright's APIRequestContext handles HTTP.
        ...devices['Desktop Chrome'],
        baseURL: appConfig.apiBaseUrl,
      },
      grep: /@api/,
    },
    {
      name: 'visual',
      use:  {
        ...devices['Desktop Chrome'],
        // Disable animations globally for visual snapshots
        launchOptions: { args: ['--force-prefers-reduced-motion'] },
      },
      grep: /@visual/,
    },
  ],
});
