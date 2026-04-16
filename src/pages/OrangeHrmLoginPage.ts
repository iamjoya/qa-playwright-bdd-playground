import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { OrangeHrmLoginLocators as L } from './locators/OrangeHrmLoginLocators';

export class OrangeHrmLoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async fillUsername(username: string): Promise<void> {
    await this.page.locator(L.usernameInput).fill(username);
  }

  async fillPassword(password: string): Promise<void> {
    await this.page.locator(L.passwordInput).fill(password);
  }

  async submit(): Promise<void> {
    await this.page.locator(L.loginButton).click();
    // Single waitForFunction covers all three outcomes with no parallel promises
    // and therefore no leaked timers bleeding into subsequent test steps:
    //   1. Navigation away from /auth/login (success)
    //   2. Alert message visible (invalid credentials)
    //   3. Required-field error visible (empty-field validation)
    await this.page.waitForFunction(
      () =>
        !window.location.href.includes('/auth/login') ||
        !!document.querySelector('.oxd-alert-content-text') ||
        !!document.querySelector('.oxd-input-field-error-message'),
      { timeout: 15_000 },
    ).catch(() => {});
  }

  /** Login and throw a descriptive error if the page does not navigate away from /auth/login. */
  async loginExpectingSuccess(username: string, password: string): Promise<void> {
    await this.login(username, password);
    if (this.page.url().includes('/auth/login')) {
      const alertVisible = await this.page.locator(L.alertText).isVisible();
      const alertMsg = alertVisible
        ? await this.page.locator(L.alertText).innerText()
        : 'no error alert visible (possible network timeout)';
      throw new Error(
        `[OrangeHrmLoginPage] Login failed — page stayed at /auth/login. ` +
        `Alert: "${alertMsg}". Verify ORANGEHRM_ADMIN_USERNAME / ORANGEHRM_ADMIN_PASSWORD.`,
      );
    }
  }

  async login(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submit();
  }

  alertLocator() {
    return this.page.locator(L.alertText);
  }

  requiredErrorLocatorFor(field: 'username' | 'password') {
    const fieldHas = field === 'username'
      ? this.page.locator(L.usernameInput)
      : this.page.locator(L.passwordInput);
    return this.page.locator(L.formRow)
      .filter({ has: fieldHas })
      .locator(L.fieldError);
  }
}
