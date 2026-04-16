# QA Automation Framework - Playground

Scalable BDD test automation for UI, API, and Visual Regression.
Stack: Playwright · playwright-bdd · TypeScript · Allure.

---

## Table of Contents

1. [Tools & Technologies](#1-tools--technologies)
2. [Architecture Overview](#2-architecture-overview)
3. [Local Setup](#3-local-setup)
4. [npm Scripts](#4-npm-scripts)
5. [Implementation Patterns](#5-implementation-patterns)
6. [Configuration Management](#6-configuration-management)
7. [Allure Reporting](#7-allure-reporting)
8. [Adding a New Feature / Step / Page](#8-adding-a-new-feature--step--page)
9. [Tagging Convention](#9-tagging-convention)
10. [Updating Visual Baselines](#10-updating-visual-baselines)

---

## 1. Tools & Technologies

### Core Stack

| Package | Version | Purpose |
|---------|---------|---------|
| `@playwright/test` | ^1.44.0 | Browser automation & parallel test execution |
| `playwright-bdd` | ^8.0.0 | BDD runner — converts Gherkin features to Playwright tests |
| `typescript` | ^5.4.0 | Static typing for test code and page objects |
| `allure-playwright` | ^3.0.0 | Reporter plugin — attaches screenshots, logs, metadata |
| `allure-js-commons` | ^3.0.0 | Allure core library |
| `allure-commandline` | ^2.27.0 | CLI for generating HTML reports from test results |

### Development Tools

| Package | Purpose |
|---------|---------|
| `@typescript-eslint/eslint-plugin` | TypeScript linting (catches unsafe patterns) |
| `eslint` | Code quality enforcement |
| `husky` | Git hooks (pre-commit linting) |
| `lint-staged` | Runs linters on staged files only |
| `dotenv` | Environment variable loading from `.env` |
| `@types/node` | Node.js type definitions |

---

## 2. Architecture Overview

The framework uses a **modular, convention-driven structure** to prevent duplication and enforce consistency:

```
agentic-qa/
├── src/
│   ├── pages/                    # Page Object Models (POM)
│   │   ├── locators/            # Pure locator definitions (no logic)
│   │   ├── BasePage.ts          # Abstract base with shared methods
│   │   └── [Page].ts            # Concrete page classes
│   ├── steps/                   # BDD step definitions
│   │   ├── ui/                  # UI/browser steps
│   │   └── api/                 # API/REST steps
│   ├── fixtures/                # Playwright fixtures (test setup, DI)
│   │   ├── index.ts            # Fixture definitions & BDD exports
│   │   └── world.ts            # Scenario-level context object
│   └── helpers/                 # Shared utilities
│       ├── ConfigHelper.ts     # Environment config resolution
│       ├── DataHelper.ts       # Test data loading with caching
│       └── AllureHelper.ts     # Allure attachments (screenshots, payloads)
├── features/                    # Gherkin BDD scenarios
│   ├── smoke/                   # Quick test suite (runs on PR)
│   ├── regression/             # Full test suite (runs on main)
│   └── Api_Test/               # API scenarios
├── test-data/                  # Test fixtures & payloads
│   ├── ui/                     # UI test data
│   ├── api/                    # API request/response examples
│   └── shared/                 # Data used by both UI & API tests
├── config/                     # Configuration files
│   ├── env/                    # Environment-specific (dev/staging/prod)
│   ├── visual.config.json      # Visual regression thresholds
│   └── playwright.config.ts    # Playwright & BDD configuration
├── snapshots/                  # Visual regression baselines (per-env)
├── allure-results/             # Raw test results (auto-generated)
└── allure-report/              # Generated HTML Allure report
```

**Key Principle:** Never duplicate test data, locators, or page logic. Use fixtures, DataHelper, and the World context to share state across tests.

---

## 3. Local Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 10+ |
| Allure CLI | 2.27+ (`npm install -g allure-commandline`) |

### Steps

```bash
# 1. Clone the repo
git clone <repo-url> && cd agentic-qa

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npm run install:browsers

# 4. Set up environment variables
cp .env.example .env
# Open .env and fill in real values for your dev environment
```

**.env** is git-ignored. Never commit real secrets. In CI, set the same variable names as GitHub Secrets — the workflow files inject them automatically.

### Running tests locally

```bash
# Generate BDD runner files from feature files (required before first run)
npm run bdd:generate

# Run the full smoke suite
npm run test:smoke

# Open the Allure report
npm run report
```

> **Tip:** Run `npm run bdd:generate` again any time you add or rename a feature file or step definition.

### Selecting an environment

```bash
# Defaults to dev (config/env/dev.json) when TEST_ENV is not set
npm run test:smoke

# Explicitly target staging or prod
npm run test:env:staging
npm run test:env:prod

# Or set it inline
TEST_ENV=staging npm run test:regression
```

---

## 4. npm Scripts

| Script | What it does |
|--------|-------------|
| `pretest` | Deletes `allure-results/` and `allure-report/` before every run so stale data never bleeds into a new report. Runs automatically before `test`. |
| `test` | Runs all tests across all projects. |
| `test:smoke` | Runs only scenarios tagged `@smoke`. |
| `test:regression` | Runs only scenarios tagged `@regression`. |
| `test:ui` | Runs the `ui-chrome` project only (all `@ui` scenarios). |
| `test:api` | Runs the `api` project only (all `@api` scenarios). |
| `test:visual` | Runs the `visual` project — asserts screenshots against stored baselines. |
| `test:visual:update` | Regenerates visual baselines. Use intentionally after a deliberate UI change. See [Updating Visual Baselines](#10-updating-visual-baselines). |
| `test:env:staging` | Sets `TEST_ENV=staging` and runs all tests against staging config. |
| `bdd:generate` | Generates Playwright test runner files from your `.feature` files. Must be run after any feature/step changes. |
| `allure:generate` | Generates the HTML report from `allure-results/`. |
| `allure:open` | Opens the generated HTML report in a browser. |
| `allure:serve` | Generates and immediately serves the report — skips the two-step generate + open. |
| `report` | `allure:generate` + `allure:open` chained. The quickest way to view results after a run. |
| `lint` | ESLint over `src/` — catches type-unsafe patterns before CI does. |
| `typecheck` | TypeScript compiler check without emitting files. Run before committing. |
| `install:browsers` | Installs Chromium, Firefox, and WebKit with OS-level dependencies. Run once after `npm install`. |

---

## 5. Implementation Patterns

This framework enforces strict patterns to eliminate duplication and ensure consistency across 100+ test scenarios.

### Fixtures & Dependency Injection

Every test receives fixtures automatically — page objects, helpers, and the scenario context:

```typescript
// src/fixtures/index.ts — defines what every test gets
interface Fixtures {
  world: World;                    // Scenario-level shared state
  loginPage: LoginPage;            // Page Object for login
  clientsPage: ClientsPage;        // Page Object for clients
  configHelper: typeof ConfigHelper;  // Static helper
  outputDir: string;               // testInfo.outputDir for visual diffs
}

// In step definitions, just request what you need:
When('I log in', async ({ loginPage, world, configHelper }) => {
  // loginPage, world, configHelper are all available
  // No instantiation, no imports, no singletons
});
```

**Why:** Fixtures isolate tests from global state. Each test starts fresh. Page objects are never shared between tests.

### World Context (Scenario-Level Shared State)

Scenarios can span UI + API steps. The `world` object persists across all steps in one scenario:

```typescript
// src/fixtures/world.ts
interface World {
  lastApiResponse: ApiResponse | null;   // API step stores response here
  lastCreatedId: string | null;          // API creates product, UI uses ID
  scenarioMetadata: {
    name: string;
    tags: string[];                      // From BDD @tags
    startedAt: Date;
  };
}

// Example:
Given('I create a product via API', async ({ request, world }) => {
  const response = await request.post('/products', { data: {...} });
  world.lastCreatedId = (await response.json()).data.id;
});

When('I view the product in the UI', async ({ clientsPage, world }) => {
  // Now I can use the ID created in the API step:
  await clientsPage.navigateTo(`/product/${world.lastCreatedId}`);
});
```

### Page Object Model (POM) Architecture

All page logic lives in `src/pages/`. No UI interaction in step definitions.

```typescript
// src/pages/LoginPage.ts — handles all login UI logic
export class LoginPage extends BasePage {
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSubmit();
  }

  private async fillEmail(email: string): Promise<void> {
    // Uses locators from LoginLocators.ts
  }
}

// src/steps/ui/loginSteps.ts — just calls the page method
When('I log in with {string} credentials', async ({ loginPage }, userType: string) => {
  const { email, password } = getData(`ui.login.${userType}`);
  await loginPage.login(email, password);  // Page object handles all details
});
```

**Never:** Copy `navigateTo()`, `waitForPageLoad()`, or `takeVisualSnapshot()` into page classes — they're in `BasePage`.

### Locator Strategy (No XPath)

Locators live in separate, data-only files — no logic, no imports:

```typescript
// src/pages/locators/LoginLocators.ts — pure data
export const LoginLocators = {
  emailInput:   { role: 'textbox' as const, name: 'Email' },
  passwordInput: { role: 'textbox' as const, name: 'Password' },
  submitBtn:     { role: 'button' as const, name: 'Continue', exact: true },
  errorMsg:      'Wrong email or password',  // getByText fallback
} as const;
```

**Locator Priority** (always in this order):
1. `getByRole` (most resilient — finds by ARIA role + name)
2. `getByText` (text content)
3. `getByLabel` (form labels)
4. `getByTestId` (test IDs)
5. CSS selectors (last resort)
6. **Never** XPath

### Step Definition Structure

BDD steps follow Given/When/Then:

```typescript
// Given — setup prerequisites (navigate, log in, create data)
Given('I am logged in as {string}', async ({ loginPage, configHelper }, userType: string) => {
  const config = configHelper.getConfig();
  await loginPage.navigateTo(config.baseUrl);
  await loginPage.login(config.credentials[userType]);
});

// When — user action (click, fill, submit)
When('I submit the form', async ({ checkoutPage }) => {
  await checkoutPage.submitForm();
});

// Then — assertion (check visibility, URL, text, count)
Then('I see the confirmation message', async ({ checkoutPage }) => {
  const isVisible = await checkoutPage.isConfirmationVisible();
  expect(isVisible).toBe(true);
});
```

**Step Rules:**
- **Zero static values** — all data from `getData()` or `world` context
- **One action per step** — no "I do X, Y, and Z" (split into separate steps)
- **Reusable language** — "I log in", "I submit the form", "I see a message" (not "I click on the login button three times")

---

## 6. Configuration Management

Each environment (dev/staging/prod) has its own config file. Credentials and URLs are never hardcoded.

### Config Loading

```typescript
// src/helpers/ConfigHelper.ts — loads & caches config
const config = ConfigHelper.getConfig();
// Reads config/env/{TEST_ENV}.json (default: dev)
// Replaces ${VAR_NAME} with process.env values
// Throws if variable is missing
```

### Environment Files

```json
// config/env/dev.json — development environment
{
  "baseUrl": "https://brook.dev.example.com",
  "apiBaseUrl": "https://api.dev.example.com",
  "credentials": {
    "adminEmail": "${ADMIN_EMAIL}",       // Resolved from .env
    "adminPassword": "${ADMIN_PASSWORD}"
  },
  "orangehrmBaseUrl": "${ORANGEHRM_BASE_URL}",
  "orangehrmCredentials": {
    "adminUsername": "${ORANGEHRM_ADMIN_USERNAME}",
    "adminPassword": "${ORANGEHRM_ADMIN_PASSWORD}"
  }
}
```

### Running Tests Against Different Environments

```bash
# Default (dev)
npm run test:smoke

# Staging
TEST_ENV=staging npm run test:regression

# Production (read-only, usually)
TEST_ENV=prod npm run test:smoke
```

---

## 7. Allure Reporting

Allure is the sole reporting tool. Test results are captured automatically; screenshots and payloads attach on failure.

### Automatic Attachments

Failures automatically capture:
- **Screenshots** — before/after failure (UI tests)
- **API Payloads** — request body + response body (API tests)
- **Visual Diffs** — expected.png, actual.png, diff.png (visual tests)

These are visible in the Allure report's step details.

### Metadata Capture

Allure captures automatically from your BDD tags:

```gherkin
@smoke @ui @P1
@allure.label.owner:joy
Scenario: Login success
  # Allure captures:
  # - Suite: @smoke → grouped under "Smoke"
  # - Type: @ui → grouped under "UI"
  # - Severity: @P1 → shown as "Critical"
  # - Owner: joy → shown under "Owners" grouping
```

### Generating & Viewing Reports

```bash
# Generate HTML from test results
npm run allure:generate
# Creates allure-report/

# Generate and immediately serve in browser
npm run allure:serve
# Opens http://localhost:4100 (auto-updates on new runs)

# Quick generate + open
npm run report
```

### Report Structure in Allure

The report organizes tests by:
- **Suites** — feature files and scenarios
- **Owners** — `@allure.label.owner:` tag
- **Severity** — P0–P3 buckets
- **Flakiness** — re-runs tracked automatically
- **Timeline** — execution order & duration
- **Attachments** — screenshots, JSON payloads (in step details)

---

## 8. Adding a New Feature / Step / Page

Every new test path follows the same four-file pattern. No exceptions — this is what prevents duplication.

### Step 1 — Write the feature file

Put it in `features/smoke/` or `features/regression/` depending on its run frequency.

```gherkin
# features/smoke/checkout.feature
@smoke @ui
@allure.label.owner:qa-team
Feature: Checkout

  @P0
  Scenario Outline: Guest user completes checkout
    Given I have a product in my cart
    When I complete checkout with "<paymentKey>" payment details
    Then the order confirmation should be displayed

    Examples:
      | paymentKey  |
      | validCard   |
      | paypalGuest |
```

Tag rules: every scenario needs at least one **suite tag** (`@smoke` / `@regression`) and one **type tag** (`@ui` / `@api` / `@visual`). See the full [Tagging Convention](#9-tagging-convention).

### Step 2 — Add test data

All scenario data lives in `test-data/`. Never put values in the feature file or step body.

```json
// test-data/ui/checkout.json
{
  "validCard": {
    "number": "4111111111111111",
    "expiry": "12/26",
    "cvv": "123"
  },
  "paypalGuest": {
    "email": "${PAYPAL_GUEST_EMAIL}"
  }
}
```

For data shared across UI and API tests, put it in `test-data/shared/`.

### Step 3 — Create the locators and page class

**Locators first** (`src/pages/locators/`):

```ts
// src/pages/locators/CheckoutLocators.ts
export const CheckoutLocators = {
  cardNumberInput: { role: 'textbox' as const, name: 'Card number' },
  expiryInput:     { role: 'textbox' as const, name: 'Expiry date' },
  cvvInput:        { role: 'textbox' as const, name: 'CVV' },
  placeOrderBtn:   { role: 'button'  as const, name: 'Place order' },
  confirmationMsg: { role: 'heading' as const, name: 'Order confirmed' },
} as const;
```

Locator rules:
- `as const` on every file — enables full autocomplete and prevents mutation.
- Priority: `getByRole` → `getByText` → `getByLabel` → `getByTestId` → CSS (last resort).
- No XPath. No logic. No imports. Locator files are data, not code.

**Page class** (`src/pages/`):

```ts
// src/pages/CheckoutPage.ts
import { Page }              from '@playwright/test';
import { BasePage }          from './BasePage';
import { CheckoutLocators }  from './locators/CheckoutLocators';

export class CheckoutPage extends BasePage {
  constructor(page: Page) { super(page); }

  async fillCardDetails(number: string, expiry: string, cvv: string): Promise<void> {
    await this.page.getByRole(CheckoutLocators.cardNumberInput.role, { name: CheckoutLocators.cardNumberInput.name }).fill(number);
    await this.page.getByRole(CheckoutLocators.expiryInput.role,     { name: CheckoutLocators.expiryInput.name }).fill(expiry);
    await this.page.getByRole(CheckoutLocators.cvvInput.role,        { name: CheckoutLocators.cvvInput.name }).fill(cvv);
  }

  async placeOrder(): Promise<void> {
    await this.page.getByRole(CheckoutLocators.placeOrderBtn.role, { name: CheckoutLocators.placeOrderBtn.name }).click();
    await this.waitForPageLoad();
  }

  isConfirmationVisible(): Promise<boolean> {
    return this.page.getByRole(CheckoutLocators.confirmationMsg.role, { name: CheckoutLocators.confirmationMsg.name }).isVisible();
  }
}
```

All page classes must extend `BasePage`. Never copy `navigateTo`, `waitForPageLoad`, or `takeVisualSnapshot` into a page class.

### Step 4 — Expose the page via fixtures

Add the new page to `src/fixtures/index.ts` so step definitions can receive it:

```ts
// In src/fixtures/index.ts — add alongside the existing loginPage fixture:
import { CheckoutPage } from '@pages/CheckoutPage';

interface Fixtures {
  // ...existing fixtures
  checkoutPage: CheckoutPage;
}

export const test = base.extend<Fixtures>({
  // ...existing fixtures
  checkoutPage: async ({ page }, use) => { await use(new CheckoutPage(page)); },
});
```

### Step 5 — Write the step definitions

```ts
// src/steps/ui/checkoutSteps.ts
import { expect }            from '@playwright/test';
import { Given, When, Then } from '@fixtures/index';
import { getData }           from '@helpers/DataHelper';
import { ConfigHelper }      from '@helpers/ConfigHelper';

Given('I have a product in my cart', async ({ page, checkoutPage }) => {
  const { baseUrl } = ConfigHelper.getConfig();
  await checkoutPage.navigateTo(`${baseUrl}/cart?add=demo-product`);
  await checkoutPage.waitForPageLoad();
});

When(
  'I complete checkout with {string} payment details',
  async ({ checkoutPage }, paymentKey: string) => {
    const payment = getData(`ui.checkout.${paymentKey}`) as {
      number: string; expiry: string; cvv: string;
    };
    await checkoutPage.fillCardDetails(payment.number, payment.expiry, payment.cvv);
    await checkoutPage.placeOrder();
  },
);

Then('the order confirmation should be displayed', async ({ checkoutPage }) => {
  expect(await checkoutPage.isConfirmationVisible()).toBe(true);
});
```

Step rules:
- Zero static values in step bodies — all data comes from `getData()` or the `world` context.
- No `fs.readFileSync` calls in steps or pages — that's `DataHelper`'s job.
- Steps receive page objects via fixtures, never by instantiating them directly.

### Step 6 — Regenerate and run

```bash
npm run bdd:generate
npm run test:smoke
```

---

## 9. Tagging Convention

Every scenario must have **exactly one suite tag** and **exactly one type tag**. Additional tags are optional.

### Suite tags — controls when the test runs

| Tag | When it runs | CI trigger |
|-----|-------------|-----------|
| `@smoke` | Every PR | On PR open / synchronize |
| `@regression` | After merge to main | On push to `main` |

### Type tags — controls which Playwright project runs the test

| Tag | Project | What it tests |
|-----|---------|--------------|
| `@ui` | `ui-chrome` | Browser-based user flows |
| `@api` | `api` | REST API endpoints via Playwright's `APIRequestContext` |
| `@visual` | `visual` | Screenshot comparison against stored baselines |

### Priority tags — controls test criticality in Allure

| Tag | Allure severity | Meaning |
|-----|----------------|---------|
| `@P0` | Blocker | System is unusable without this path working |
| `@P1` | Critical | Core happy path — maps to `@smoke` scenarios |
| `@P2` | Normal | Important but not release-blocking — maps to `@regression` |
| `@P3` | Minor | Edge case or low-risk scenario |

> The `@smoke` / `@regression` tags drive **execution**. The `@P0`–`@P3` tags drive **severity display in Allure**. Use both.

### Ownership tag

```gherkin
@allure.label.owner:your-name
```

Add to the `Feature:` block to apply to all scenarios in the file, or to individual scenarios to override. Shows up in Allure's Owners grouping.

### Accessibility tag

| Tag | Meaning |
|-----|---------|
| `@a11y` | Accessibility check scenario. Runs in the `ui-chrome` project alongside `@ui`. |

### Full example

```gherkin
@regression @api @P2
@allure.label.owner:joy
Scenario: Create user fails with invalid role
```

```gherkin
@smoke @ui @P1
@allure.label.owner:joy
Scenario Outline: Successful login
```

---

## 10. Updating Visual Baselines

Visual baselines are PNG screenshots stored in `snapshots/{env}/` and committed to git. They are the source of truth for visual tests. **Do not regenerate them casually** — only do this after a deliberate, reviewed UI change.

### When to update baselines

- A designer shipped approved visual changes (new layout, updated colours, typography update).
- You added a new `@visual` scenario and no baseline exists yet for it.
- The app moved to a new version that changes a stable, intentional design.

### When NOT to update baselines

- A test is failing and you want it to pass. Investigate the diff first.
- You changed something unrelated and baselines broke as a side-effect — that's a real failure.

### How to update locally

```bash
# Regenerate baselines for the current TEST_ENV (defaults to dev)
npm run test:visual:update

# Regenerate for a specific environment
TEST_ENV=staging npm run test:visual:update
```

Baselines are stored per-environment under `snapshots/dev/`, `snapshots/staging/`, etc. Regenerating dev baselines never touches staging or prod baselines.

After regenerating, **always review the diff in git** before committing:

```bash
git diff --stat snapshots/
```

Open any changed `.png` files in your diff tool to visually confirm the change is intentional, then commit and push.

### How to update in CI (for a PR)

Use the `visual.yml` workflow's manual dispatch:

1. Go to **Actions → Visual Regression Tests → Run workflow**.
2. Set **Regenerate visual baselines** to `true`.
3. Run. The updated snapshots are uploaded as a workflow artifact.
4. Download the artifact, copy the contents into `snapshots/`, commit, and push.

### Baseline thresholds

Thresholds are set in `config/visual.config.json`:

```json
{
  "threshold": 0.2,
  "maxDiffPixels": 100,
  "animations": "disabled",
  "fullPage": false
}
```

- `threshold` — maximum ratio of differing pixels (0–1). Default `0.2` allows for minor anti-aliasing differences across OS/GPU.
- `maxDiffPixels` — hard cap on the number of differing pixels regardless of threshold.
- `animations: "disabled"` — freezes CSS animations so screenshots are deterministic.

To tighten the threshold for a specific scenario (e.g. pixel-perfect brand elements), pass options directly in the step:

```ts
await visualPage.takeVisualSnapshot('hero-banner.png', { threshold: 0.05, maxDiffPixels: 10 });
```
