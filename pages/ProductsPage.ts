/**
 * ProductsPage — page object for /products and /product_details/:id
 * SELECTORS: Isolated constants below — update here if the site changes.
 */
import { type Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

// ── Selector constants ─────────────────────────────────────────────
const PRODUCTS_SELECTORS = {
  // Products listing page
  allProductsHeading: 'h2:has-text("All Products")',
  productList: '.features_items',
  productCard: '.features_items .col-sm-4',
  productName: '.productinfo h2, .product-information h2',
  productPrice: '.productinfo p, .product-information span span',
  viewProductLink: 'a[href*="/product_details/"]',

  // Search
  searchInput: '#search_product',
  searchButton: '#submit_search',
  searchResultsTitle: 'h2:has-text("Searched Products")',
  searchedProducts: '.features_items .col-sm-4',

  // Product detail page
  productDetailName: '.product-information h2',
  productDetailCategory: '.product-information p:has-text("Category")',
  productDetailPrice: '.product-information span span',
  productDetailAvailability: '.product-information p:has-text("Availability")',
  productDetailCondition: '.product-information p:has-text("Condition")',
  addToCartButton: 'button:has-text("Add to cart"), .add-to-cart',

  // After add to cart modal
  viewCartLink: 'u:has-text("View Cart"), a:has-text("View Cart")',
  continueShoppingButton: 'button:has-text("Continue Shopping")',
};

export class ProductsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Navigate to the products page. */
  async navigate(): Promise<void> {
    await this.goto('/products');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Assert the all products page is loaded. */
  async assertLoaded(): Promise<void> {
    await expect(
      this.page.locator(PRODUCTS_SELECTORS.allProductsHeading)
    ).toBeVisible({ timeout: 10_000 });
  }

  /** Assert product list is visible and has items. */
  async assertProductsVisible(): Promise<void> {
    await expect(
      this.page.locator(PRODUCTS_SELECTORS.productList)
    ).toBeVisible();
    const count = await this.page.locator(PRODUCTS_SELECTORS.productCard).count();
    expect(count, 'Expected at least one product on the page').toBeGreaterThan(0);
  }

  /** Get count of product cards on the page. */
  async getProductCount(): Promise<number> {
    return this.page.locator(PRODUCTS_SELECTORS.productCard).count();
  }

  /**
   * View the details of the first product on the page.
   * Returns the product name as displayed on the list page.
   */
  async viewFirstProduct(): Promise<void> {
    const firstViewLink = this.page
      .locator(PRODUCTS_SELECTORS.viewProductLink)
      .first();
    await firstViewLink.scrollIntoViewIfNeeded();
    await firstViewLink.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Assert product detail page is loaded with all required fields. */
  async assertProductDetailLoaded(): Promise<void> {
    await expect(
      this.page.locator(PRODUCTS_SELECTORS.productDetailName)
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      this.page.locator(PRODUCTS_SELECTORS.productDetailPrice)
    ).toBeVisible();
    await expect(
      this.page.locator(PRODUCTS_SELECTORS.productDetailAvailability)
    ).toBeVisible();
    await expect(
      this.page.locator(PRODUCTS_SELECTORS.productDetailCondition)
    ).toBeVisible();
  }

  /** Search for a product by name. */
  async searchProduct(query: string): Promise<void> {
    await this.page.locator(PRODUCTS_SELECTORS.searchInput).fill(query);
    await this.page.locator(PRODUCTS_SELECTORS.searchButton).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Assert search results heading is visible. */
  async assertSearchResultsVisible(): Promise<void> {
    await expect(
      this.page.locator(PRODUCTS_SELECTORS.searchResultsTitle)
    ).toBeVisible({ timeout: 8000 });
  }

  /** Get count of products shown in search results. */
  async getSearchResultCount(): Promise<number> {
    return this.page.locator(PRODUCTS_SELECTORS.searchedProducts).count();
  }

  /**
   * Add the first visible product to the cart.
   * Clicks the "Add to cart" button on the products list hover.
   */
  async addFirstProductToCart(): Promise<void> {
    // Hover over the first product card to reveal the Add to Cart button
    const firstCard = this.page.locator(PRODUCTS_SELECTORS.productCard).first();
    await firstCard.scrollIntoViewIfNeeded();
    await firstCard.hover();

    const addBtn = firstCard.locator('a.add-to-cart').first();
    await addBtn.waitFor({ state: 'visible', timeout: 5000 });
    await addBtn.click();
  }

  /** Click "Continue Shopping" in the post-add-to-cart modal. */
  async continueShopping(): Promise<void> {
    const btn = this.page.locator(PRODUCTS_SELECTORS.continueShoppingButton);
    await btn.waitFor({ state: 'visible', timeout: 5000 });
    await btn.click();
  }

  /** Click "View Cart" in the post-add-to-cart modal. */
  async goToCartFromModal(): Promise<void> {
    const link = this.page.locator(PRODUCTS_SELECTORS.viewCartLink).first();
    await link.waitFor({ state: 'visible', timeout: 5000 });
    await link.click();
  }
}
