import { expect }           from '@playwright/test';
import { Given, When, Then } from '@fixtures/index';
import { getData }            from '@helpers/DataHelper';
import { ConfigHelper }       from '@helpers/ConfigHelper';

// ── Navigate to Admin User Management (Background step) ───────────────────────

Given('I navigate to the Admin User Management page', async ({ orangehrmAdminPage }) => {
  const { orangehrmBaseUrl } = ConfigHelper.getConfig();
  await orangehrmAdminPage.navigateTo(
    `${orangehrmBaseUrl}/web/index.php/admin/viewSystemUsers`,
  );
  await orangehrmAdminPage.waitForPageLoad();
});

// ── Add User ──────────────────────────────────────────────────────────────────

When('I open the Add User form', async ({ orangehrmAdminPage }) => {
  await orangehrmAdminPage.openAddUserForm();
});

When(
  'I add a new system user with {string} data',
  async ({ orangehrmAdminPage }, dataKey: string) => {
    const data = getData(`ui.orangehrm-admin.${dataKey}`) as {
      role: string;
      status: string;
      employeeName: string;
      username: string;
      password: string;
      confirmPassword: string;
    };

    // Pre-cleanup for demo site persistence: if the "valid" user already exists
    // from a previous run, delete them first so the add step can succeed.
    if (dataKey === 'valid') {
      await orangehrmAdminPage.searchUser(data.username);
      const exists = await orangehrmAdminPage.userRowLocator(data.username).isVisible();
      if (exists) {
        await orangehrmAdminPage.deleteUser(data.username);
      }
    }

    await orangehrmAdminPage.addUser(data);
  },
);

When(
  'I submit the Add User form without filling required fields',
  async ({ orangehrmAdminPage }) => {
    await orangehrmAdminPage.submitAddUserForm();
  },
);

// ── Assertions after add ──────────────────────────────────────────────────────

Then(
  'the user {string} should appear in the users list',
  async ({ orangehrmAdminPage }, dataKey: string) => {
    const { expectedInList } = getData(`ui.orangehrm-admin.${dataKey}`) as {
      expectedInList: string;
    };
    await orangehrmAdminPage.searchUser(expectedInList);
    // Use an extended timeout: the demo site's search API may need a moment to
    // reflect a freshly added user, especially on a shared environment.
    await expect(orangehrmAdminPage.userRowLocator(expectedInList)).toBeVisible({ timeout: 20_000 });
  },
);

// ── Delete User ───────────────────────────────────────────────────────────────

When(
  'I delete the user {string} from the list',
  async ({ orangehrmAdminPage }, dataKey: string) => {
    const { expectedInList } = getData(`ui.orangehrm-admin.${dataKey}`) as {
      expectedInList: string;
    };
    await orangehrmAdminPage.deleteUser(expectedInList);
  },
);

Then(
  'the user {string} should no longer appear in the users list',
  async ({ orangehrmAdminPage }, dataKey: string) => {
    const { expectedInList } = getData(`ui.orangehrm-admin.${dataKey}`) as {
      expectedInList: string;
    };
    await orangehrmAdminPage.searchUser(expectedInList);
    await expect(orangehrmAdminPage.userRowLocator(expectedInList)).not.toBeVisible();
  },
);

// ── Validation error assertions ───────────────────────────────────────────────

Then(
  'required field errors should be displayed on the Add User form',
  async ({ orangehrmAdminPage }) => {
    // OrangeHRM shows required errors on the empty Add User form.
    // Count reflects the current demo site form (6 fields as of 2026-04).
    await expect(orangehrmAdminPage.requiredErrorsLocator()).toHaveCount(6);
  },
);

Then('I should see a duplicate username error', async ({ orangehrmAdminPage }) => {
  await expect(orangehrmAdminPage.duplicateErrorLocator()).toBeVisible();
});

// ── Visual baseline ───────────────────────────────────────────────────────────

Then(
  'the OrangeHRM Admin User Management page should match the visual baseline',
  async ({ orangehrmAdminPage, outputDir }) => {
    await orangehrmAdminPage.takeVisualSnapshot(
      'orangehrm-admin-users.png',
      undefined,
      outputDir,
    );
  },
);
