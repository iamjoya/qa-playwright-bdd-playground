import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { OrangeHrmSidebarLocators as L } from './locators/OrangeHrmSidebarLocators';

export class OrangeHrmSidebarPage extends BasePage {
  // Holds the nav item count captured before a search is applied so that
  // clearSearch() and the "all items visible" step can compare against the
  // real baseline rather than a hardcoded number.
  private _preSearchCount: number | null = null;

  constructor(page: Page) {
    super(page);
  }

  get preSearchCount(): number | null {
    return this._preSearchCount;
  }

  async searchMenu(term: string): Promise<void> {
    const input = this.page.locator(L.searchInput);
    // Wait for the sidebar to be fully rendered before capturing the baseline
    // count — counting before the DOM is ready yields 0 and breaks the assertion.
    await input.waitFor({ state: 'visible' });
    this._preSearchCount = await this.navItemsLocator().count();
    await input.fill(term);
  }

  async clearSearch(): Promise<void> {
    const input = this.page.locator(L.searchInput);
    // Use fill('') to ensure Vue.js reactivity picks up the change, then wait
    // until the nav count is fully restored to the pre-search baseline.
    await input.fill('');
    const target = this._preSearchCount ?? 1;
    await this.page.waitForFunction(
      ({ selector, count }: { selector: string; count: number }) =>
        document.querySelectorAll(selector).length >= count,
      { selector: L.navItemLinks, count: target },
      { timeout: 10_000 },
    );
  }

  async clickMenuItem(name: string): Promise<void> {
    // Pass an explicit timeout to override the global actionTimeout — some
    // OrangeHRM modules are slow to load and exceed the default 15 s.
    await this.page
      .getByRole(L.navItem(name).role, { name: L.navItem(name).name })
      .click({ timeout: 60_000 });
    // Use domcontentloaded instead of 'load' — some modules' full 'load'
    // can exceed the test timeout; DOM-ready is sufficient for URL assertions.
    await this.page.waitForLoadState('domcontentloaded');
  }

  sidebarBodyLocator() {
    return this.page.locator(L.sidebarBody);
  }

  menuItemLocator(name: string) {
    return this.page.getByRole(L.navItem(name).role, { name: L.navItem(name).name });
  }

  navItemsLocator() {
    return this.page.locator(L.navItemLinks);
  }
}
