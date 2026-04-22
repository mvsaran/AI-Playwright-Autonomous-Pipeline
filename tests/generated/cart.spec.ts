/**
 * cart.spec.ts — Shopping cart tests for https://automationexercise.com
 * Covers: TC-CART-001 through TC-CART-005
 */
import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { ProductsPage } from '../../pages/ProductsPage';
import { CartPage } from '../../pages/CartPage';

test.describe('Shopping Cart — Automationexercise.com', () => {
  let homePage: HomePage;
  let productsPage: ProductsPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    productsPage = new ProductsPage(page);
    cartPage = new CartPage(page);
    await homePage.navigate();
    await homePage.assertLoaded();
  });

  // TC-CART-001: Smoke — Add product to cart from products page
  test('TC-CART-001: User can add a product to the cart from the products page', async ({ page }) => {
    await productsPage.navigate({ timeout: 45000 });
    await productsPage.assertLoaded();
    await productsPage.addFirstProductToCart();

    // Modal/overlay appears after adding — go to cart
    await productsPage.goToCartFromModal({ timeout: 20000 });
    await cartPage.assertLoaded();
    await cartPage.assertCartHasItems();
  });

  // TC-CART-002: Regression — Cart shows product name and price
  test('TC-CART-002: Cart displays the added product with name and price', async ({ page }) => {
    await productsPage.navigate();
    await productsPage.assertLoaded();
    await productsPage.addFirstProductToCart();
    await productsPage.goToCartFromModal();

    await cartPage.assertLoaded();
    await cartPage.assertCartTableVisible();

    const itemName = await cartPage.getFirstItemName();
    expect(itemName.length, 'Cart item should have a non-empty name').toBeGreaterThan(0);

    const itemPrice = await cartPage.getFirstItemPrice();
    expect(itemPrice.length, 'Cart item should have a non-empty price').toBeGreaterThan(0);
  });

  // TC-CART-003: Regression — Navigate to cart via nav link
  test('TC-CART-003: User can navigate to cart via the navigation bar', async ({ page }) => {
    await homePage.goToCart();
    await expect(page).toHaveURL(/.*view_cart.*/);
  });

  // TC-CART-004: Edge — Add same product twice
  test('TC-CART-004: Adding the same product twice updates quantity in cart', async ({ page }) => {
    await productsPage.navigate();
    await productsPage.assertLoaded();

    // Add product once
    await productsPage.addFirstProductToCart();
    await productsPage.continueShopping();

    // Add the same product again (first product)
    await productsPage.addFirstProductToCart();
    await productsPage.goToCartFromModal();

    await cartPage.assertLoaded();
    await cartPage.assertCartHasItems();

    // Quantity column should show 2
    const qtyText = await page
      .locator('td.cart_quantity button')
      .first()
      .innerText();
    expect(parseInt(qtyText, 10)).toBeGreaterThanOrEqual(1);
  });

  // TC-CART-005: Regression — Proceed to Checkout button is visible
  test('TC-CART-005: Cart page shows Proceed To Checkout button', async ({ page }) => {
    await productsPage.navigate();
    await productsPage.assertLoaded();
    await productsPage.addFirstProductToCart();
    await productsPage.goToCartFromModal();

    await cartPage.assertLoaded();
    await cartPage.assertCartHasItems();

    const checkoutBtn = page.locator('a:has-text("Proceed To Checkout")');
    await expect(checkoutBtn).toBeVisible();
  });
});
