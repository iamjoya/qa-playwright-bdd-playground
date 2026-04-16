import { Page, expect }          from '@playwright/test';
import { attachVisualDiff }      from '@helpers/AllureHelper';

export interface SnapshotOptions {
  threshold?:     number;
  maxDiffPixels?: number;
  animations?:    'disabled' | 'allow';
  fullPage?:      boolean;
}

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('load');
  }

  async takeVisualSnapshot(
    snapshotName: string,
    options?: SnapshotOptions,
    outputDir?: string,
  ): Promise<void> {
    try {
      await expect(this.page).toHaveScreenshot(snapshotName, options);
    } catch (error) {
      if (outputDir) await attachVisualDiff(outputDir, snapshotName);
      throw error;
    }
  }

  async capturePageState(): Promise<{ url: string; title: string }> {
    return {
      url:   this.page.url(),
      title: await this.page.title(),
    };
  }
}
