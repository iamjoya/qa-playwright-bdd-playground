import { Page, expect }     from '@playwright/test';
import { BasePage }          from './BasePage';
import { ClientsLocators }   from './locators/ClientsLocators';
import { attachVisualDiff }  from '@helpers/AllureHelper';


export class ClientsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Clients list ────────────────────────────────────────────────────────────

  async openAddClientDialog(): Promise<void> {
    await this.page
      .getByRole(ClientsLocators.addButton.role, { name: ClientsLocators.addButton.name })
      .click();
    await this.page
      .getByRole(ClientsLocators.dialogHeading.role, {
        name:  ClientsLocators.dialogHeading.name,
        level: ClientsLocators.dialogHeading.level,
      })
      .waitFor({ state: 'visible' });
  }

  async searchForClient(name: string): Promise<void> {
    await this.page
      .getByRole(ClientsLocators.searchInput.role, { name: ClientsLocators.searchInput.name })
      .fill(name);
    // Search filtering can be async; wait for any row content containing the client name.
    await expect(this.page.getByRole(ClientsLocators.clientsGrid.role).getByText(name, { exact: false })).toBeVisible({ timeout: 15000 });
  }

  async isClientInList(name: string): Promise<boolean> {
    const { role, name: linkName } = ClientsLocators.clientLink(name);
    try {
      await this.page
        .getByRole(role, { name: linkName })
        .waitFor({ state: 'visible', timeout: 10_000 });
      return true;
    } catch {
      return false;
    }
  }

  async clickNextStep(): Promise<void> {
    await this.page
      .getByRole(ClientsLocators.nextStepButton.role, { name: ClientsLocators.nextStepButton.name })
      .click();
    // Wait for the form to transition to the next step
    await this.page.waitForTimeout(500);
  }

  async selectClientType(type: 'Individual' | 'Business'): Promise<void> {
    await this.page.getByRole(ClientsLocators.clientTypeCombobox.role, { name: ClientsLocators.clientTypeCombobox.name }).click({ force: true });
    await this.page.getByRole('option', { name: type, exact: true }).click();
  }

  async fillFirstName(value: string): Promise<void> {
    await this.page
      .getByRole(ClientsLocators.firstNameInput.role, { name: ClientsLocators.firstNameInput.name })
      .fill(value);
  }

  async fillLastName(value: string): Promise<void> {
    await this.page
      .getByRole(ClientsLocators.lastNameInput.role, { name: ClientsLocators.lastNameInput.name })
      .fill(value);
  }

  async fillBusinessName(value: string): Promise<void> {
    await this.page
      .getByRole(ClientsLocators.businessNameInput.role, { name: ClientsLocators.businessNameInput.name })
      .fill(value);
  }
  async submitClient(): Promise<void> {
    // Try "Create Client" first; fall back to any remaining primary dialog button
    const createBtn = this.page.getByRole('button', { name: /create client/i });
    const saveBtn   = this.page.getByRole('button', { name: /save/i });
    const nextBtn   = this.page.getByRole('button', { name: 'Next Step' });

    if (await createBtn.isVisible()) {
      await createBtn.click();
    } else if (await saveBtn.isVisible()) {
      await saveBtn.click();
    } else {
      // Last step may still show "Next Step" as the submit trigger
      await nextBtn.click();
    }

    await this.waitForPageLoad();
  }

  // ── Dialog — Step 2: Primary Person required fields ─────────────────────────
  //
  // Step 2 enforces four fields before the wizard can advance:
  //   * Category  * First Name  * Last Name  * E-mail  * Country  * Preferred Language
  // First Name / Last Name are auto-populated from Step 1 — no action needed.
  // The rest are filled with minimal valid values.

  async fillPrimaryPersonRequiredFields(): Promise<void> {
    // Category — Ant Design combobox (required)
    await this.selectFirstAntOption('* Category');

    // E-mail — plain textbox (required)
    await this.page
      .getByRole('textbox', { name: '* E-mail' })
      .fill(`autotest+${Date.now()}@example.com`);

    // Country — Ant Design combobox (required)
    await this.selectFirstAntOption('* Country');

    // Preferred Language — Ant Design combobox (required)
    // Accessible name includes the help icon text: "* Preferred Language question-circle"
    await this.selectFirstAntOption(/Preferred Language/);
  }

  /**
   * Opens an Ant Design select (combobox role) by accessible name and clicks
   * the first option in the resulting listbox.
   *
   * Ant Design v5 properly exposes role=combobox on the select trigger, and
   * role=option on each item once the listbox is open. This is the canonical
   * Playwright approach — no CSS hacks needed.
   */
  private async selectFirstAntOption(name: string | RegExp): Promise<void> {
    const combobox = this.page.getByRole('combobox', { name });
    // Scroll into view so the dropdown portal opens within the headless viewport.
    await combobox.scrollIntoViewIfNeeded();
    await combobox.click({ force: true });
    await this.page.waitForTimeout(300);

    // Multiple closed Ant Design portals stay in the DOM — getByRole('option').first()
    // always resolves to the first portal's items (e.g. Category) regardless of which
    // dropdown is currently open. Instead, evaluate() finds the first VISIBLE listbox
    // by computed style and clicks its first non-disabled option. This correctly targets
    // the currently-open dropdown and triggers React's synthetic event system.
    await this.page.evaluate(() => {
      const listboxes = Array.from(document.querySelectorAll<HTMLElement>('[role="listbox"]'));
      for (const lb of listboxes) {
        const s = window.getComputedStyle(lb);
        if (s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0) {
          const opt = lb.querySelector<HTMLElement>('[role="option"]:not([aria-disabled="true"])');
          if (opt) { opt.click(); return; }
        }
      }
    });
  }

  // ── Visual helpers ────────────────────────────────────────────────────────────

  async takeDialogSnapshot(snapshotName: string, outputDir?: string): Promise<void> {
    const dialog = this.page.getByRole(
      ClientsLocators.dialog.role,
      { name: ClientsLocators.dialog.name },
    );
    try {
      await expect(dialog).toHaveScreenshot(snapshotName);
    } catch (error) {
      if (outputDir) await attachVisualDiff(outputDir, snapshotName);
      throw error;
    }
  }
}
