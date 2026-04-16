import * as fs   from 'fs';
import * as path from 'path';
import { Page }  from '@playwright/test';
import * as allure from 'allure-js-commons';

/**
 * Attaches a PNG screenshot to the current Allure step/test.
 * Safe to call outside an Allure context — the attachment is simply skipped.
 *
 * @param page  - Playwright Page instance
 * @param label - Attachment label shown in the Allure report (e.g. 'Before failure', 'After failure')
 */
export async function attachScreenshot(page: Page, label: string): Promise<void> {
  try {
    const buffer = await page.screenshot({ fullPage: false });
    await allure.attachment(label, buffer, { contentType: 'image/png' });
  } catch {
    // Silently ignore if page is closed or allure context unavailable
  }
}

/**
 * Attaches a JSON payload (request or response body) to the current Allure step/test.
 * Safe to call outside an Allure context.
 *
 * @param label - Attachment label shown in the Allure report (e.g. 'Request Body', 'Response Body')
 * @param data  - The value to serialize. Handles undefined/null gracefully.
 */
export async function attachApiPayload(label: string, data: unknown): Promise<void> {
  if (data === undefined || data === null) return;
  try {
    const content = JSON.stringify(data, null, 2);
    await allure.attachment(label, content, { contentType: 'application/json' });
  } catch {
    // Silently ignore if allure context unavailable
  }
}

/**
 * Attaches expected/actual/diff PNG files to Allure when a visual snapshot fails.
 * Playwright writes these three files to testInfo.outputDir when toHaveScreenshot() fails.
 *
 * @param outputDir    - testInfo.outputDir for the failing test
 * @param snapshotName - snapshot name passed to toHaveScreenshot (e.g. 'my-snapshot.png')
 */
export async function attachVisualDiff(outputDir: string, snapshotName: string): Promise<void> {
  const baseName = snapshotName.replace(/\.png$/i, '');
  const files = [
    { label: 'Visual Baseline (Expected)', suffix: '-expected.png' },
    { label: 'Visual Actual',              suffix: '-actual.png'   },
    { label: 'Visual Diff (Highlighted)',  suffix: '-diff.png'     },
  ];
  for (const { label, suffix } of files) {
    const filePath = path.join(outputDir, `${baseName}${suffix}`);
    if (fs.existsSync(filePath)) {
      try {
        const buffer = fs.readFileSync(filePath);
        await allure.attachment(label, buffer, { contentType: 'image/png' });
      } catch {
        // Silently ignore if allure context unavailable
      }
    }
  }
}
