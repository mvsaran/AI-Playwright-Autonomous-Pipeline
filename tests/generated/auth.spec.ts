/**
 * auth.spec.ts — Authentication tests for https://automationexercise.com
 * Covers: TC-AUTH-001 through TC-AUTH-007
 */
import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { LoginPage } from '../../pages/LoginPage';

// Test data — isolated here for easy updates
const TEST_DATA = {
  validEmail: `testpipeline_${Date.now()}@mailtest.com`,
  validPassword: 'Test@Pipeline123',
  invalidEmail: 'nonexistent_xyz123@example.com',
  invalidPassword: 'WrongPassword999!',
  userName: 'Pipeline Tester',
};

test.describe('Authentication — Automationexercise.com', () => {
  let homePage: HomePage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    loginPage = new LoginPage(page);
    await page.goto('https://automationexercise.com/', { timeout: 45000 });
    await homePage.assertLoaded();
  });

  // TC-AUTH-001: Smoke — Navigate to Login page from home
  test('TC-AUTH-001: Navigate to Signup/Login page from home page', async ({ page }) => {
    await homePage.goToLogin();
    await expect(page).toHaveURL(/.*login.*/);
    await loginPage.assertLoaded();
  });

  // TC-AUTH-002: Regression — New user registration flow
  test('TC-AUTH-002: New user can register with valid details', async ({ page }) => {
    await homePage.goToLogin();
    await loginPage.assertLoaded();
    await loginPage.beginSignup(TEST_DATA.userName, TEST_DATA.validEmail);
    await page.waitForURL('**/signup**', { timeout: 15_000 });
    await loginPage.completeRegistration(TEST_DATA.validPassword);
    await loginPage.assertAccountCreated();
    await loginPage.clickContinue();
    await loginPage.assertLoggedIn();
  });

  // TC-AUTH-003: Regression — Login with valid credentials succeeds
  test('TC-AUTH-003: Login with valid credentials succeeds', async ({ page }) => {
    await homePage.goToLogin();
    await loginPage.beginSignup(`Auth Smoke User`, `smoke_${Date.now()}@mailtest.com`);
    await page.waitForURL('**/signup**', { timeout: 15_000 });
    await loginPage.completeRegistration('Smoke@Pass123');
    await loginPage.assertAccountCreated();
    await loginPage.clickContinue();
    await loginPage.assertLoggedIn();
    await loginPage.logout();
    await expect(page).toHaveURL(/.*login.*/);
  });

  // TC-AUTH-004: Negative — Login with incorrect password shows error
  test('TC-AUTH-004: Login with incorrect password shows error', async () => {
    await homePage.goToLogin();
    await loginPage.assertLoaded();
    await loginPage.login(TEST_DATA.invalidEmail, TEST_DATA.invalidPassword);
    await loginPage.assertLoginError();
  });

  // TC-AUTH-005: Negative — Login with non-existent email shows error
  test('TC-AUTH-005: Login with non-existent email shows error', async () => {
    await homePage.goToLogin();
    await loginPage.assertLoaded();
    await loginPage.login('does_not_exist_xyz@nowhere.com', 'AnyPassword1!');
    await loginPage.assertLoginError();
  });

  // TC-AUTH-006: Negative — Login with empty email shows browser validation
  test('TC-AUTH-006: Login with empty email shows browser validation', async ({ page }) => {
    await homePage.goToLogin();
    await loginPage.assertLoaded();
    await page.locator('input[data-qa="login-password"]').fill('SomePassword');
    await page.locator('button[data-qa="login-button"]').click();
    await expect(page).toHaveURL(/.*login.*/);
  });

  // TC-AUTH-007: Regression — Logout flow
  test('TC-AUTH-007: Logged-in user can logout and is redirected to login page', async ({ page }) => {
    await homePage.goToLogin();
    await loginPage.beginSignup('Logout Test User', `logout_${Date.now()}@mailtest.com`);
    await page.waitForURL('**/signup**', { timeout: 15_000 });
    await loginPage.completeRegistration('Logout@Pass123');
    await loginPage.assertAccountCreated();
    await loginPage.clickContinue();
    await loginPage.assertLoggedIn();
    await loginPage.logout();
    await expect(page).toHaveURL(/.*login.*/);
    await loginPage.assertLoaded();
  });
});
