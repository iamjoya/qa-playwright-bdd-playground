import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { LoginLocators } from './locators/LoginLocators';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Landing page ─────────────────────────────────────────────────────────────

  async clickLogin(): Promise<void> {
    await this.page
      .getByRole(LoginLocators.landingLoginButton.role, {
        name: LoginLocators.landingLoginButton.name,
      })
      .click();
    await this.waitForPageLoad();
  }

  // ── Auth0 login form ──────────────────────────────────────────────────────────

  async fillEmail(email: string): Promise<void> {
    await this.page
      .getByRole(LoginLocators.emailInput.role, { name: LoginLocators.emailInput.name })
      .fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.page
      .getByRole(LoginLocators.passwordInput.role, { name: LoginLocators.passwordInput.name })
      .fill(password);
  }

  async submit(): Promise<void> {
    await this.page
      .getByRole(LoginLocators.submitButton.role, {
        name:  LoginLocators.submitButton.name,
        exact: LoginLocators.submitButton.exact,
      })
      .click();
    await this.waitForPageLoad();
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async getErrorMessage(): Promise<string> {
    const el = this.page.getByText(LoginLocators.errorMessage);
    await el.waitFor({ state: 'visible' });
    return el.innerText();
  }
}
