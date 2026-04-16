import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { OrangeHrmAdminLocators as L } from './locators/OrangeHrmAdminLocators';

export class OrangeHrmAdminPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openAddUserForm(): Promise<void> {
    await this.page
      .getByRole(L.addButton.role, { name: L.addButton.name })
      .click();
    await this.waitForPageLoad();
  }

  // Scope to the individual input group that owns the given label — more precise
  // than .oxd-form-row because User Role and Status share the same row.
  private inputGroup(labelText: string) {
    return this.page.locator(L.inputGroup).filter({
      has: this.page.locator('label', { hasText: labelText }),
    });
  }

  async fillUserRole(role: string): Promise<void> {
    await this.inputGroup('User Role').locator(L.selectText).click();
    await this.page.locator(L.dropdownOption(role)).click();
  }

  async fillStatus(status: string): Promise<void> {
    await this.inputGroup('Status').locator(L.selectText).click();
    await this.page.locator(L.dropdownOption(status)).click();
  }

  async fillEmployeeName(name: string): Promise<void> {
    const input = this.inputGroup('Employee Name').locator('input');
    await input.click();
    await input.type(name, { delay: 50 });
    // Wait for the autocomplete dropdown to appear with filtered results
    await this.page.locator(L.autocompleteDropdown).waitFor({ state: 'visible', timeout: 5000 });
    // Wait for the specific employee name to appear, then click the matching option
    const matchingOption = this.page.locator(L.autocompleteOption).filter({ hasText: name });
    await matchingOption.first().waitFor({ state: 'visible', timeout: 5000 });
    await matchingOption.first().click();
    // Small delay to ensure OrangeHRM processes the selection and removes validation error
    await this.page.waitForTimeout(300);
  }

  async fillUsername(username: string): Promise<void> {
    await this.inputGroup('Username').locator('input').fill(username);
  }

  async fillPassword(password: string): Promise<void> {
    // Use /^Password/ to match "Password *" but NOT "Confirm Password *"
    await this.page.locator(L.inputGroup)
      .filter({ has: this.page.locator('label', { hasText: /^Password/ }) })
      .locator('input')
      .fill(password);
  }

  async fillConfirmPassword(password: string): Promise<void> {
    await this.inputGroup('Confirm Password').locator('input').fill(password);
  }

  async submitAddUserForm(): Promise<void> {
    await this.page
      .getByRole(L.saveButton.role, { name: L.saveButton.name })
      .click();
    // Do NOT call waitForPageLoad() here — when required fields are empty,
    // OrangeHRM shows inline validation errors without navigating, so
    // waiting for 'load' event would hang.
  }

  async addUser(data: {
    role: string;
    status: string;
    employeeName: string;
    username: string;
    password: string;
    confirmPassword: string;
  }): Promise<void> {
    await this.openAddUserForm();
    await this.fillUserRole(data.role);
    await this.fillStatus(data.status);
    await this.fillEmployeeName(data.employeeName);
    await this.fillUsername(data.username);
    await this.fillPassword(data.password);
    await this.fillConfirmPassword(data.confirmPassword);
    await this.submitAddUserForm();
    // After save: success → navigates TO viewSystemUsers; failure → inline error appears.
    // Use a positive URL condition so the race never resolves instantly because the
    // current URL already satisfies a negative check.
    await Promise.race([
      this.page.waitForURL(
        (url) => url.toString().includes('viewSystemUsers'),
        { timeout: 30_000 },
      ).catch(() => {}),
      this.page.locator(L.requiredErrors).first().waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {}),
      this.page.locator(L.duplicateError).waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {}),
    ]);

    // Distinguish expected inline errors (duplicate username) from unexpected ones
    // (validation failures, bad form data) so callers always get an explicit signal.
    if (!this.page.url().includes('viewSystemUsers')) {
      const duplicateVisible = await this.page.locator(L.duplicateError).isVisible();
      if (duplicateVisible) {
        return; // Expected outcome for duplicate-username scenarios — caller asserts it.
      }
      const requiredVisible = await this.page.locator(L.requiredErrors).first().isVisible();
      if (requiredVisible) {
        const msgs = await this.page.locator(L.requiredErrors).allTextContents();
        throw new Error(
          `[OrangeHrmAdminPage] addUser() failed — unexpected form errors: ${msgs.join(' | ')}. ` +
          `Check that all required fields (including Employee Name autocomplete) were filled correctly.`,
        );
      }
      throw new Error(
        `[OrangeHrmAdminPage] addUser() ended in unexpected state. URL: ${this.page.url()}`,
      );
    }
  }

  async searchUser(username: string): Promise<void> {
    // Guard: if not already on the user list, navigate there first.
    // This handles the case where addUser() resolves via a duplicate error
    // and leaves us on the add-form URL instead of viewSystemUsers.
    if (!this.page.url().includes('viewSystemUsers')) {
      const origin = new URL(this.page.url()).origin;
      await this.navigateTo(`${origin}/web/index.php/admin/viewSystemUsers`);
      await this.waitForPageLoad();
    }
    await this.inputGroup('Username').locator('input').fill(username);
    // Arm the response listener BEFORE clicking so the XHR is never missed.
    // waitForResponse on the OrangeHRM user-search endpoint is reliable;
    // waitForLoadState('networkidle') hangs indefinitely on sites with
    // background polling and caused 60 s test timeouts.
    const searchComplete = this.page.waitForResponse(
      (r) => r.url().includes('/api/v2/admin/users') && r.status() === 200,
      { timeout: 15_000 },
    ).catch(() => {});
    await this.page
      .getByRole(L.searchButton.role, { name: L.searchButton.name })
      .click();
    await searchComplete;
  }

  userRowLocator(username: string) {
    return this.page.locator(L.tableRow(username));
  }

  async deleteUser(username: string): Promise<void> {
    await this.page.locator(L.rowCheckbox(username)).check({ force: true });
    await this.page
      .getByRole(L.deleteButton.role, { name: L.deleteButton.name })
      .click();
    // Wait for the confirmation dialog to appear before clicking the confirm button
    await this.page
      .getByRole(L.confirmDeleteButton.role, { name: L.confirmDeleteButton.name })
      .waitFor({ state: 'visible', timeout: 5000 });
    await this.page
      .getByRole(L.confirmDeleteButton.role, { name: L.confirmDeleteButton.name })
      .click();
    await this.waitForPageLoad();
  }

  requiredErrorsLocator() {
    return this.page.locator(L.requiredErrors);
  }

  duplicateErrorLocator() {
    return this.page.locator(L.duplicateError);
  }
}
