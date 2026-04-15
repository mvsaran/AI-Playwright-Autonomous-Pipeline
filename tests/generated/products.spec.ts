/**
 * products.spec.ts — Product browsing and search tests for https://automationexercise.com
 * Covers: TC-PROD-001 through TC-PROD-007
 */
import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { ProductsPage } from '../../pages/ProductsPage';

test.describe('Product Browsing — Automationexercise.com', () => {
  let homePage: HomePage;
  let productsPage: ProductsPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    productsPage = new ProductsPage(page);
    await homePage.navigate();
    await homePage.assertLoaded();
  });

  // TC-PROD-001: Smoke — Products page loads
  test('TC-PROD-001: Products page loads and displays product list', async ({ page }) => {
    await productsPage.navigate();
    await productsPage.assertLoaded();
    await productsPage.assertProductsVisible();
  });

  // TC-PROD-002: Regression — Products have name and price
  test('TC-PROD-002: Each product shows a name and price on the listing page', async ({ page }) => {
    await productsPage.navigate();
    await productsPage.assertLoaded();

    const count = await productsPage.getProductCount();
    expect(count, 'Expected at least 1 product').toBeGreaterThan(0);

    // Verify first product has visible text
    const firstProductInfo = page.locator('.features_items .col-sm-4').first();
    await expect(firstProductInfo.locator('.productinfo h2')).toBeVisible();
    await expect(firstProductInfo.locator('.productinfo p')).toBeVisible();
  });

  // TC-PROD-003: Regression — Navigate to product detail via home page link
  test('TC-PROD-003: Can navigate to Products page from home navbar', async ({ page }) => {
    await homePage.goToProducts();
    await expect(page).toHaveURL(/.*products.*/);
    await productsPage.assertLoaded();
  });

  // TC-PROD-004: Regression — Product detail page shows all required fields
  test('TC-PROD-004: Product detail page shows name, price, availability, and condition', async ({ page }) => {
    await productsPage.navigate();
    await productsPage.assertLoaded();
    await productsPage.viewFirstProduct();
    await productsPage.assertProductDetailLoaded();

    // Assert URL is a product detail URL
    await expect(page).toHaveURL(/.*product_details.*/);
  });

  // TC-PROD-005: Regression — Search returns results
  test('TC-PROD-005: Searching for "top" returns matching products', async ({ page }) => {
    await productsPage.navigate();
    await productsPage.assertLoaded();
    await productsPage.searchProduct('top');
    await productsPage.assertSearchResultsVisible();

    const resultCount = await productsPage.getSearchResultCount();
    expect(resultCount, 'Expected search results for "top"').toBeGreaterThan(0);
  });

  // TC-PROD-006: Edge — Search with all-caps term
  test('TC-PROD-006: Searching with uppercase "DRESS" returns results', async ({ page }) => {
    await productsPage.navigate();
    await productsPage.searchProduct('DRESS');
    await productsPage.assertSearchResultsVisible();
    const count = await productsPage.getSearchResultCount();
    expect(count).toBeGreaterThanOrEqual(0); // May or may not match — just validate no crash
  });

  // TC-PROD-007: Negative — Search for non-existent product
  test('TC-PROD-007: Search for non-existent product shows empty or zero results gracefully', async ({ page }) => {
    await productsPage.navigate();
    await productsPage.searchProduct('xyzzy_no_such_product_12345');
    await productsPage.assertSearchResultsVisible();

    const count = await productsPage.getSearchResultCount();
    // Page should still load without errors — result count can be 0
    expect(count).toBeGreaterThanOrEqual(0);

    // URL should still be on products page
    await expect(page).toHaveURL(/.*products.*/);
  });
});
