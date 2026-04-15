/**
 * BasePage — shared utilities and navigation for all page objects.
 * All page objects extend this class.
 */
import { type Page, type Locator, expect } from '@playwright/test';

export class BasePage {
  protected readonly page: Page;

  // ── Shared selectors ────────────────────────────────────────────
  // NOTE: These are isolated here for easy updates if the site changes.
  protected readonly SELECTORS = {
    // Navigation bar links
    navHome: 'a[href="/"]',
    navProducts: 'a[href="/products"]',
    navCart: 'a[href="/view_cart"]',
    navLogin: 'a[href="/login"]',
    navLogout: 'a[href="/logout"]',
    navContactUs: 'a[href="/contact_us"]',

    // Common elements
    pageHeader: 'h2, h1',
    successAlert: '.alert-success',
    errorMessage: 'p[style*="color: red"], .alert-error, #form p',

    // Ad/modal overlays (common on this site)
    adCloseButton: '#ad-bg, .modal-close, .fc-close-button',
  };

  constructor(page: Page) {
    this.page = page;
  }

  /** Navigate to a URL relative to baseURL. */
  async goto(path = '/'): Promise<void> {
    await this.page.goto(path);
  }

  /** Dismiss any ad overlay/modal if it appears. */
  async dismissAd(): Promise<void> {
    try {
      const adFrame = this.page.frames().find((f) => f.url().includes('ad'));
      if (adFrame) {
        const closeBtn = adFrame.locator('.close-button, .fc-close-button');
        if (await closeBtn.isVisible({ timeout: 3000 })) {
          await closeBtn.click();
        }
      }
    } catch {
      // No ad present — continue
    }
  }

  /** Click a navigation link by its text. */
  async clickNav(text: string): Promise<void> {
    await this.page.getByRole('link', { name: text }).first().click();
  }

  /** Wait for URL to contain a given path segment. */
  async waitForUrl(urlPart: string, timeout = 15_000): Promise<void> {
    await this.page.waitForURL(`**/${urlPart}**`, { timeout });
  }

  /** Assert page title contains expected text. */
  async assertTitle(expectedText: string): Promise<void> {
    await expect(this.page).toHaveTitle(new RegExp(expectedText, 'i'));
  }

  /** Assert that a visible element contains expected text. */
  async assertVisible(locator: Locator, message?: string): Promise<void> {
    await expect(locator, message).toBeVisible();
  }

  /** Get the current page URL. */
  currentUrl(): string {
    return this.page.url();
  }

  /** Scroll to element and click (avoids overlap issues). */
  async scrollAndClick(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
    await locator.click();
  }
}
