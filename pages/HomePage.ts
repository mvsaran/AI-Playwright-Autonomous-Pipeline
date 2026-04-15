/**
 * HomePage — page object for https://automationexercise.com (home page).
 * SELECTORS: Isolated constants below — update here if the site changes.
 */
import { type Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

// ── Selector constants (update here if site changes) ──────────────
const HOME_SELECTORS = {
  logo: 'img[src*="logo"], .logo, a.navbar-brand',
  heroSection: '#slider, .carousel, .features_items',
  featuredProducts: '.features_items .col-sm-4',
  subscribeEmailInput: '#susbscribe_email',   // Note: typo is on the site itself
  subscribeButton: '#subscribe',
  subscriptionSuccessMsg: '#success-subscribe',
  navbar: '#header .nav',
};

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Navigate to the home page. */
  async navigate(): Promise<void> {
    await this.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Assert home page is loaded with key elements. */
  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle(/Automation Exercise/i);
    await expect(this.page.locator(HOME_SELECTORS.navbar)).toBeVisible();
  }

  /** Assert the navigation bar is visible. */
  async assertNavbarVisible(): Promise<void> {
    await expect(this.page.locator(HOME_SELECTORS.navbar)).toBeVisible();
  }

  /** Assert featured products section is visible. */
  async assertFeaturedProductsVisible(): Promise<void> {
    await expect(this.page.locator(HOME_SELECTORS.heroSection)).toBeVisible();
  }

  /** Get count of featured product cards on the home page. */
  async getFeaturedProductCount(): Promise<number> {
    return this.page.locator(HOME_SELECTORS.featuredProducts).count();
  }

  /** Subscribe with an email address. */
  async subscribeWithEmail(email: string): Promise<void> {
    const input = this.page.locator(HOME_SELECTORS.subscribeEmailInput);
    await expect(input).toBeVisible();
    await input.fill(email);
    await this.page.locator(HOME_SELECTORS.subscribeButton).click();
  }

  /** Check subscription success message is visible. */
  async assertSubscriptionSuccess(): Promise<void> {
    await expect(
      this.page.locator(HOME_SELECTORS.subscriptionSuccessMsg)
    ).toBeVisible({ timeout: 5000 });
  }

  /** Navigate to the login page via nav link. */
  async goToLogin(): Promise<void> {
    await this.clickNav('Signup / Login');
  }

  /** Navigate to Products page. */
  async goToProducts(): Promise<void> {
    await this.clickNav('Products');
  }

  /** Navigate to Cart. */
  async goToCart(): Promise<void> {
    await this.clickNav('Cart');
  }

  /** Navigate to Contact Us. */
  async goToContactUs(): Promise<void> {
    await this.clickNav('Contact us');
  }
}
