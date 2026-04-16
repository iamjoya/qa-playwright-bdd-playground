import { test as base }              from 'playwright-bdd';
import { createBdd }                  from 'playwright-bdd';
import { createWorld, World }         from './world';
import { ConfigHelper }               from '@helpers/ConfigHelper';
import { LoginPage }                  from '@pages/LoginPage';
import { ClientsPage }                from '@pages/ClientsPage';
import { OrangeHrmLoginPage }         from '@pages/OrangeHrmLoginPage';
import { OrangeHrmSidebarPage }       from '@pages/OrangeHrmSidebarPage';
import { OrangeHrmAdminPage }         from '@pages/OrangeHrmAdminPage';
import { attachScreenshot }           from '@helpers/AllureHelper';

// ── Fixture types ────────────────────────────────────────────────────────────

interface Fixtures {
  world:                World;
  loginPage:            LoginPage;
  clientsPage:          ClientsPage;
  orangehrmLoginPage:   OrangeHrmLoginPage;
  orangehrmSidebarPage: OrangeHrmSidebarPage;
  orangehrmAdminPage:   OrangeHrmAdminPage;
  configHelper:         typeof ConfigHelper;
  outputDir:            string;
}

// ── Extended test object ──────────────────────────────────────────────────────

export const test = base.extend<Fixtures>({
  /** Scenario-level context object — reset for every test. */
  world: async ({}, use, testInfo) => {
    const world = createWorld();
    world.scenarioMetadata.name      = testInfo.title;
    world.scenarioMetadata.tags      = testInfo.tags ?? [];
    world.scenarioMetadata.startedAt = new Date();
    await use(world);
  },

  /** ConfigHelper singleton — no state, safe to share. */
  configHelper: async ({}, use) => { await use(ConfigHelper); },

  /** testInfo.outputDir — per-test directory where Playwright writes diff PNGs on visual failure. */
  outputDir: async ({}, use, testInfo) => { await use(testInfo.outputDir); },

  /** Page objects — fresh instance per test. */
  loginPage:            async ({ page }, use) => { await use(new LoginPage(page)); },
  clientsPage:          async ({ page }, use) => { await use(new ClientsPage(page)); },
  orangehrmLoginPage:   async ({ page }, use) => { await use(new OrangeHrmLoginPage(page)); },
  orangehrmSidebarPage: async ({ page }, use) => { await use(new OrangeHrmSidebarPage(page)); },
  orangehrmAdminPage:   async ({ page }, use) => { await use(new OrangeHrmAdminPage(page)); },

  /**
   * Auto-fixture: attaches before+after screenshots on any UI test failure.
   * Overrides the base `page` fixture — runs transparently for every test.
   */
  page: async ({ page }, use, testInfo) => {
    let beforeScreenshotBuffer: Buffer | null = null;
    try {
      beforeScreenshotBuffer = await page.screenshot();
    } catch { /* page not yet navigated — fine */ }

    await use(page);

    if (testInfo.status !== 'passed') {
      if (beforeScreenshotBuffer) {
        const allure = await import('allure-js-commons');
        await allure.attachment('Before failure', beforeScreenshotBuffer, { contentType: 'image/png' });
      }
      await attachScreenshot(page, 'After failure');
    }
  },
});

export const { Given, When, Then, Step, Before, After } = createBdd(test);

// Re-export world types for step definition files
export type { World };
