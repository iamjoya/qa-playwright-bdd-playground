import { expect }             from '@playwright/test';
import { Given, When, Then }   from '@fixtures/index';
import { getData }              from '@helpers/DataHelper';
import { ConfigHelper }         from '@helpers/ConfigHelper';

// ── Step: navigate to landing page and click Login → Auth0 ───────────────────

Given('I am on the login page', async ({ loginPage }) => {
  const { baseUrl } = ConfigHelper.getConfig();
  await loginPage.navigateTo(baseUrl);
  await loginPage.waitForPageLoad();
  await loginPage.clickLogin();
  await loginPage.waitForPageLoad();
});

// ── Step: perform login ───────────────────────────────────────────────────────
//
// Credentials come exclusively from ConfigHelper (resolved from config/env/*.json).
// test-data/ui/login.json holds only assertion data — never credentials.
// DataHelper does NOT resolve ${VAR} refs, so credentials must never live in JSON.

When(
  'I log in with the {string} credentials',
  async ({ loginPage }, credentialKey: string) => {
    const config = ConfigHelper.getConfig();

    let email: string;
    let password: string;

    if (credentialKey === 'admin') {
      email    = config.credentials.adminEmail;
      password = config.credentials.adminPassword;
    } else if (credentialKey === 'invalid') {
      const data = getData(`ui.login.${credentialKey}`) as { email: string; password: string };
      email    = data.email;
      password = data.password;
    } else {
      throw new Error(`[loginSteps] Unknown credentialKey: "${credentialKey}". Add it to test-data/ui/login.json and this step.`);
    }

    await loginPage.login(email, password);
  },
);

// ── Step: assert post-login URL ───────────────────────────────────────────────

Then(
  'I should be redirected to the expected landing page for {string}',
  async ({ page }, credentialKey: string) => {
    const { expectedLandingUrl } = getData(`ui.login.${credentialKey}`) as {
      expectedLandingUrl: string;
    };
    await expect(page).toHaveURL(new RegExp(expectedLandingUrl));
  },
);

// ── Step: assert nav element visible after login ──────────────────────────────

Then('the clients navigation should be visible', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Clients' })).toBeVisible();
});

// ── Step: assert Auth0 error message ─────────────────────────────────────────

Then(
  'I should see the expected error message for {string}',
  async ({ loginPage }, credentialKey: string) => {
    const { expectedError } = getData(`ui.login.${credentialKey}`) as {
      expectedError: string;
    };
    const actual = await loginPage.getErrorMessage();
    expect(actual).toContain(expectedError);
  },
);

// ── Step: visual snapshot of the login page ───────────────────────────────────

Then('the login page should match the visual baseline', async ({ loginPage, outputDir }) => {
  await loginPage.takeVisualSnapshot('auth0-login-page.png', undefined, outputDir);
});
