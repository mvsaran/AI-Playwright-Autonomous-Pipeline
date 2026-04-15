/**
 * CartPage — page object for /view_cart
 * SELECTORS: Isolated constants below — update here if the site changes.
 */
import { type Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

// ── Selector constants ─────────────────────────────────────────────
const CART_SELECTORS = {
  cartTable: '#cart_info_table',
  cartRows: '#cart_info_table tbody tr',
  productNameInCart: 'td.cart_description h4 a',
  productPriceInCart: 'td.cart_price p',
  productQtyInCart: 'td.cart_quantity button',
  productTotalInCart: 'td.cart_total p',
  removeButton: 'a.cart_quantity_delete',
  emptyCartMessage: 'b:has-text("Cart is empty")',
  proceedToCheckoutButton: 'a:has-text("Proceed To Checkout")',
  cartPageHeading: 'li.active:has-text("Shopping Cart")',
};

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Navigate to the cart page. */
  async navigate(): Promise<void> {
    await this.goto('/view_cart');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Assert cart page is loaded. */
  async assertLoaded(): Promise<void> {
    // URL must contain view_cart
    await this.page.waitForURL('**/view_cart**', { timeout: 10_000 });
  }

  /** Assert cart has at least one item. */
  async assertCartHasItems(): Promise<void> {
    const rowCount = await this.page.locator(CART_SELECTORS.cartRows).count();
    expect(rowCount, 'Cart should have at least one item').toBeGreaterThan(0);
  }

  /** Assert cart is empty (shows empty message). */
  async assertCartIsEmpty(): Promise<void> {
    await expect(
      this.page.locator(CART_SELECTORS.emptyCartMessage)
    ).toBeVisible({ timeout: 5000 });
  }

  /** Get count of items in the cart. */
  async getCartItemCount(): Promise<number> {
    return this.page.locator(CART_SELECTORS.cartRows).count();
  }

  /** Get the name of the first cart item. */
  async getFirstItemName(): Promise<string> {
    return this.page
      .locator(CART_SELECTORS.productNameInCart)
      .first()
      .innerText();
  }

  /** Get the price of the first cart item (as text, e.g., "Rs. 500"). */
  async getFirstItemPrice(): Promise<string> {
    return this.page
      .locator(CART_SELECTORS.productPriceInCart)
      .first()
      .innerText();
  }

  /** Assert the cart table is visible (product was added). */
  async assertCartTableVisible(): Promise<void> {
    await expect(
      this.page.locator(CART_SELECTORS.cartTable)
    ).toBeVisible({ timeout: 8000 });
  }

  /** Remove the first item from the cart. */
  async removeFirstItem(): Promise<void> {
    await this.page.locator(CART_SELECTORS.removeButton).first().click();
    await this.page.waitForTimeout(1000); // Wait for cart to update
  }

  /** Click Proceed To Checkout. */
  async proceedToCheckout(): Promise<void> {
    await this.page
      .locator(CART_SELECTORS.proceedToCheckoutButton)
      .click();
  }
}
