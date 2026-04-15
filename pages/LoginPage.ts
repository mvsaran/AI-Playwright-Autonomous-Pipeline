/**
 * LoginPage — page object for /login (signup and login forms).
 * SELECTORS: Isolated constants below — update here if the site changes.
 *
 * NOTE: automationexercise.com combines login and signup on one page (/login).
 */
import { type Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

// ── Selector constants ─────────────────────────────────────────────
const LOGIN_SELECTORS = {
  // Login form (right side / bottom section)
  loginEmailInput: 'input[data-qa="login-email"]',
  loginPasswordInput: 'input[data-qa="login-password"]',
  loginButton: 'button[data-qa="login-button"]',
  loginErrorMsg: 'p[style*="color: red"]',         // "Your email or password is incorrect!"

  // Signup form (new user)
  signupNameInput: 'input[data-qa="signup-name"]',
  signupEmailInput: 'input[data-qa="signup-email"]',
  signupButton: 'button[data-qa="signup-button"]',
  signupErrorMsg: 'p[style*="color: red"]',          // "Email Address already exist!"

  // Account info page (after clicking Signup)
  accountInfoHeading: 'b',                            // "Enter Account Information"
  titleMrRadio: '#id_gender1',
  passwordInput: 'input[data-qa="password"]',
  dateOfBirthDay: 'select[data-qa="days"]',
  dateOfBirthMonth: 'select[data-qa="months"]',
  dateOfBirthYear: 'select[data-qa="years"]',
  firstNameInput: 'input[data-qa="first_name"]',
  lastNameInput: 'input[data-qa="last_name"]',
  addressInput: 'input[data-qa="address"]',
  countrySelect: 'select[data-qa="country"]',
  stateInput: 'input[data-qa="state"]',
  cityInput: 'input[data-qa="city"]',
  zipcodeInput: 'input[data-qa="zipcode"]',
  mobileInput: 'input[data-qa="mobile_number"]',
  createAccountButton: 'button[data-qa="create-account"]',

  // Post-registration
  accountCreatedHeading: 'b',                          // "Account Created!"
  continueButton: 'a[data-qa="continue-button"]',

  // Logged-in state
  loggedInAs: 'li a:has-text("Logged in as")',

  // Page heading
  loginHeading: 'h2:has-text("Login to your account")',
  signupHeading: 'h2:has-text("New User Signup!")',
};

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Navigate directly to the login page. */
  async navigate(): Promise<void> {
    await this.goto('/login');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Assert the login page is loaded. */
  async assertLoaded(): Promise<void> {
    await expect(this.page.locator(LOGIN_SELECTORS.loginHeading)).toBeVisible();
    await expect(this.page.locator(LOGIN_SELECTORS.signupHeading)).toBeVisible();
  }

  /** Perform login with email and password. */
  async login(email: string, password: string): Promise<void> {
    await this.page.locator(LOGIN_SELECTORS.loginEmailInput).fill(email);
    await this.page.locator(LOGIN_SELECTORS.loginPasswordInput).fill(password);
    await this.page.locator(LOGIN_SELECTORS.loginButton).click();
  }

  /** Assert login error message is visible. */
  async assertLoginError(): Promise<void> {
    await expect(
      this.page.locator(LOGIN_SELECTORS.loginErrorMsg)
    ).toBeVisible({ timeout: 5000 });
  }

  /** Assert user is logged in (nav shows "Logged in as"). */
  async assertLoggedIn(): Promise<void> {
    await expect(
      this.page.locator(LOGIN_SELECTORS.loggedInAs)
    ).toBeVisible({ timeout: 10_000 });
  }

  /** Begin signup — fill name and email, click Signup button. */
  async beginSignup(name: string, email: string): Promise<void> {
    await this.page.locator(LOGIN_SELECTORS.signupNameInput).fill(name);
    await this.page.locator(LOGIN_SELECTORS.signupEmailInput).fill(email);
    await this.page.locator(LOGIN_SELECTORS.signupButton).click();
  }

  /** Assert signup email-already-exists error. */
  async assertSignupEmailExistsError(): Promise<void> {
    await expect(
      this.page.locator(LOGIN_SELECTORS.signupErrorMsg)
    ).toContainText('Email Address already exist');
  }

  /**
   * Complete the full account registration form.
   * Call this after beginSignup() has navigated to the account info page.
   */
  async completeRegistration(password: string): Promise<void> {
    // Select title
    await this.page.locator(LOGIN_SELECTORS.titleMrRadio).check();
    await this.page.locator(LOGIN_SELECTORS.passwordInput).fill(password);

    // Date of birth
    await this.page.locator(LOGIN_SELECTORS.dateOfBirthDay).selectOption('10');
    await this.page.locator(LOGIN_SELECTORS.dateOfBirthMonth).selectOption('6');
    await this.page.locator(LOGIN_SELECTORS.dateOfBirthYear).selectOption('1990');

    // Address details
    await this.page.locator(LOGIN_SELECTORS.firstNameInput).fill('Test');
    await this.page.locator(LOGIN_SELECTORS.lastNameInput).fill('Pipeline');
    await this.page.locator(LOGIN_SELECTORS.addressInput).fill('123 Automation Street');
    await this.page.locator(LOGIN_SELECTORS.countrySelect).selectOption('United States');
    await this.page.locator(LOGIN_SELECTORS.stateInput).fill('California');
    await this.page.locator(LOGIN_SELECTORS.cityInput).fill('Los Angeles');
    await this.page.locator(LOGIN_SELECTORS.zipcodeInput).fill('90001');
    await this.page.locator(LOGIN_SELECTORS.mobileInput).fill('1234567890');

    await this.page.locator(LOGIN_SELECTORS.createAccountButton).click();
  }

  /** Assert account created successfully. */
  async assertAccountCreated(): Promise<void> {
    await expect(
      this.page.locator(LOGIN_SELECTORS.accountCreatedHeading)
    ).toContainText('Account Created');
  }

  /** Click Continue after account creation. */
  async clickContinue(): Promise<void> {
    await this.page.locator(LOGIN_SELECTORS.continueButton).click();
  }

  /** Logout by clicking the logout nav link. */
  async logout(): Promise<void> {
    await this.page.locator(this.SELECTORS.navLogout).click();
    await this.waitForUrl('login');
  }
}
