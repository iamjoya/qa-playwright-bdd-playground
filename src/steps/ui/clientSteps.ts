import { expect }             from '@playwright/test';
import { Given, When, Then }   from '@fixtures/index';
import { getData }              from '@helpers/DataHelper';
import { ConfigHelper }         from '@helpers/ConfigHelper';

// ── Background steps — shared by both feature files ──────────────────────────

Given('I am logged in as admin', async ({ loginPage, page }) => {
  const { baseUrl, credentials } = ConfigHelper.getConfig();
  await loginPage.navigateTo(baseUrl);
  await loginPage.waitForPageLoad();
  await loginPage.clickLogin();
  await loginPage.waitForPageLoad();
  await loginPage.login(credentials.adminEmail, credentials.adminPassword);
  // Confirm successful login — Clients nav button is only present when authenticated
  await expect(page.getByRole('button', { name: 'Clients' })).toBeVisible();
});

Given('I navigate to the clients page', async ({ clientsPage }) => {
  const { baseUrl } = ConfigHelper.getConfig();
  await clientsPage.navigateTo(`${baseUrl}admin/clients`);
  await clientsPage.waitForPageLoad();
});

// ── Dialog open ───────────────────────────────────────────────────────────────

When('I open the Add Client dialog', async ({ clientsPage }) => {
  await clientsPage.openAddClientDialog();
});

// ── Client Type selection ─────────────────────────────────────────────────────

When(
  'I select client type {string}',
  async ({ clientsPage }, clientType: string) => {
    await clientsPage.selectClientType(clientType as 'Individual' | 'Business');
  },
);

// ── Individual client — Step 1 ────────────────────────────────────────────────

When(
  'I fill in the individual client details with {string} data',
  async ({ clientsPage }, dataKey: string) => {
    const data = getData(`ui.clients.${dataKey}`) as {
      firstName: string;
      lastName:  string;
    };
    await clientsPage.fillFirstName(data.firstName);
    await clientsPage.fillLastName(data.lastName);
  },
);

// ── Business client — Step 1 ──────────────────────────────────────────────────

When(
  'I fill in the business client details with {string} data',
  async ({ clientsPage }, dataKey: string) => {
    const data = getData(`ui.clients.${dataKey}`) as {
      businessName: string;
    };
    await clientsPage.fillBusinessName(data.businessName);
  },
);

// ── Proceed through remaining steps and submit ────────────────────────────────
//
// Step 2 (Primary Person / Business Details) and Step 3/4 (Summary) have no
// required fields — clicking through completes the wizard.

When('I proceed through the remaining steps', async ({ clientsPage }) => {
  // Step 2 — Primary Person: fill required fields (E-mail, Country, Preferred Language)
  await clientsPage.clickNextStep();
  await clientsPage.fillPrimaryPersonRequiredFields();
  // Step 3 — Summary (Individual) or Step 3 of 4 Primary Person (Business)
  await clientsPage.clickNextStep();
  // Final submit — closes dialog; for Business the Summary is Step 4
  await clientsPage.submitClient();
});

// ── Assert client appears in list ─────────────────────────────────────────────

Then(
  'the client {string} should appear in the clients list',
  async ({ clientsPage }, dataKey: string) => {
    const data = getData(`ui.clients.${dataKey}`) as { expectedInList: string };
    await clientsPage.searchForClient(data.expectedInList);
    const visible = await clientsPage.isClientInList(data.expectedInList);
    expect(visible).toBe(true);
  },
);

// ── Visual baseline snapshots ─────────────────────────────────────────────────

Then(
  'the Add Client dialog should match the visual baseline {string}',
  async ({ clientsPage, outputDir }, snapshotName: string) => {
    await clientsPage.takeDialogSnapshot(snapshotName, outputDir);
  },
);
