import { expect }           from '@playwright/test';
import { Given, When, Then } from '@fixtures/index';
import { getData }            from '@helpers/DataHelper';
import { ConfigHelper }       from '@helpers/ConfigHelper';

// ── Navigate to OrangeHRM login page ─────────────────────────────────────────

Given('I am on the OrangeHRM login page', async ({ orangehrmLoginPage }) => {
  const { orangehrmBaseUrl } = ConfigHelper.getConfig();
  await orangehrmLoginPage.navigateTo(`${orangehrmBaseUrl}/web/index.php/auth/login`);
  await orangehrmLoginPage.waitForPageLoad();
});

// ── Shared background step: log in as admin (reused by sidebar + admin features) ──

Given('I am logged in to OrangeHRM as admin', async ({ orangehrmLoginPage, page }) => {
  const { orangehrmBaseUrl, orangehrmCredentials } = ConfigHelper.getConfig();
  await orangehrmLoginPage.navigateTo(`${orangehrmBaseUrl}/web/index.php/auth/login`);
  await orangehrmLoginPage.waitForPageLoad();
  await orangehrmLoginPage.loginExpectingSuccess(orangehrmCredentials.adminUsername, orangehrmCredentials.adminPassword);
  await expect(page).toHaveURL(new RegExp('/web/index.php/dashboard/index'));
});

// ── Perform login with a named credential key ─────────────────────────────────

When(
  'I log in to OrangeHRM with {string} credentials',
  async ({ orangehrmLoginPage }, credentialKey: string) => {
    const config = ConfigHelper.getConfig();

    let username: string;
    let password: string;

    if (credentialKey === 'admin') {
      username = config.orangehrmCredentials.adminUsername;
      password = config.orangehrmCredentials.adminPassword;
    } else {
      const data = getData(`ui.orangehrm-login.${credentialKey}`) as {
        username: string;
        password: string;
      };
      username = data.username;
      password = data.password;
    }

    await orangehrmLoginPage.login(username, password);
  },
);

// ── Submit with one field intentionally left empty ───────────────────────────

When(
  'I submit the OrangeHRM login form with empty {string}',
  async ({ orangehrmLoginPage }, emptyField: string) => {
    const config = ConfigHelper.getConfig();

    if (emptyField === 'username') {
      await orangehrmLoginPage.fillPassword(config.orangehrmCredentials.adminPassword);
    } else {
      await orangehrmLoginPage.fillUsername(config.orangehrmCredentials.adminUsername);
    }

    await orangehrmLoginPage.submit();
  },
);

// ── Assertions ────────────────────────────────────────────────────────────────

Then('I should be redirected to the OrangeHRM dashboard', async ({ page }) => {
  const { expectedLandingUrl } = getData('ui.orangehrm-login.admin') as {
    expectedLandingUrl: string;
  };
  await expect(page).toHaveURL(new RegExp(expectedLandingUrl));
});

Then('the sidebar navigation should be visible', async ({ orangehrmSidebarPage }) => {
  await expect(orangehrmSidebarPage.sidebarBodyLocator()).toBeVisible();
});

Then(
  'I should see the OrangeHRM login error for {string}',
  async ({ orangehrmLoginPage }, credentialKey: string) => {
    const { expectedError } = getData(`ui.orangehrm-login.${credentialKey}`) as {
      expectedError: string;
    };
    await expect(orangehrmLoginPage.alertLocator()).toContainText(expectedError);
  },
);

Then(
  'I should see the OrangeHRM field required error for {string}',
  async ({ orangehrmLoginPage }, field: string) => {
    const { emptyErrors } = getData('ui.orangehrm-login') as {
      emptyErrors: Record<string, string>;
    };
    await expect(
      orangehrmLoginPage.requiredErrorLocatorFor(field as 'username' | 'password'),
    ).toContainText(emptyErrors[field]);
  },
);

Then(
  'the OrangeHRM login page should match the visual baseline',
  async ({ orangehrmLoginPage, outputDir }) => {
    await orangehrmLoginPage.takeVisualSnapshot(
      'orangehrm-login-page.png',
      undefined,
      outputDir,
    );
  },
);
