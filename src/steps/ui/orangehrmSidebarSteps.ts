import { expect }      from '@playwright/test';
import { When, Then }   from '@fixtures/index';

// ── Sidebar navigation ────────────────────────────────────────────────────────

When(
  'I click the {string} sidebar menu',
  async ({ orangehrmSidebarPage }, menuItem: string) => {
    await orangehrmSidebarPage.clickMenuItem(menuItem);
  },
);

Then(
  'I should be navigated to the OrangeHRM {string} page',
  async ({ page }, expectedUrlFragment: string) => {
    await expect(page).toHaveURL(new RegExp(expectedUrlFragment.replace(/\//g, '\\/')));
  },
);

// ── Sidebar search ────────────────────────────────────────────────────────────

When(
  'I search {string} in the sidebar',
  async ({ orangehrmSidebarPage }, term: string) => {
    await orangehrmSidebarPage.searchMenu(term);
  },
);

When('I clear the sidebar search', async ({ orangehrmSidebarPage }) => {
  await orangehrmSidebarPage.clearSearch();
});

Then(
  'the sidebar should show the {string} menu item',
  async ({ orangehrmSidebarPage }, menuItem: string) => {
    await expect(orangehrmSidebarPage.menuItemLocator(menuItem)).toBeVisible();
  },
);

Then('non-matching sidebar items should not be visible', async ({ orangehrmSidebarPage }) => {
  // After searching "Admin", exactly 1 nav item should be visible
  await expect(orangehrmSidebarPage.navItemsLocator()).toHaveCount(1);
});

Then('no sidebar menu items should be visible', async ({ orangehrmSidebarPage }) => {
  await expect(orangehrmSidebarPage.navItemsLocator()).toHaveCount(0);
});

Then('all sidebar menu items should be visible', async ({ orangehrmSidebarPage }) => {
  // Compare against the live count captured in searchMenu() before filtering was
  // applied — not a hardcoded number — so this stays valid if the demo module
  // list ever changes.
  await expect(orangehrmSidebarPage.navItemsLocator()).toHaveCount(orangehrmSidebarPage.preSearchCount!);
});

Then(
  'the OrangeHRM sidebar should match the visual baseline',
  async ({ orangehrmSidebarPage, outputDir }) => {
    await orangehrmSidebarPage.takeVisualSnapshot(
      'orangehrm-sidebar.png',
      undefined,
      outputDir,
    );
  },
);
