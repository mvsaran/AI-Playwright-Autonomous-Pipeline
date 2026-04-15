/**
 * ContactPage — page object for /contact_us
 * SELECTORS: Isolated constants below — update here if the site changes.
 */
import { type Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

// ── Selector constants ─────────────────────────────────────────────
const CONTACT_SELECTORS = {
  pageHeading: 'h2:has-text("Get In Touch")',
  nameInput: 'input[data-qa="name"]',
  emailInput: 'input[data-qa="email"]',
  subjectInput: 'input[data-qa="subject"]',
  messageTextarea: 'textarea[data-qa="message"]',
  fileUpload: 'input[name="upload_file"]',
  submitButton: 'input[data-qa="submit-button"]',
  successMessage: '.status.alert-success',
  homeButton: 'a:has-text("Home")',
};

export class ContactPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Navigate to the Contact Us page. */
  async navigate(): Promise<void> {
    await this.goto('/contact_us');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Assert the Contact Us page is loaded. */
  async assertLoaded(): Promise<void> {
    await expect(
      this.page.locator(CONTACT_SELECTORS.pageHeading)
    ).toBeVisible({ timeout: 10_000 });
  }

  /** Fill in the contact form with valid data. */
  async fillForm(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<void> {
    await this.page.locator(CONTACT_SELECTORS.nameInput).fill(data.name);
    await this.page.locator(CONTACT_SELECTORS.emailInput).fill(data.email);
    await this.page.locator(CONTACT_SELECTORS.subjectInput).fill(data.subject);
    await this.page.locator(CONTACT_SELECTORS.messageTextarea).fill(data.message);
  }

  /**
   * Submit the contact form.
   * Handles the browser alert that appears on submission.
   */
  async submitForm(): Promise<void> {
    // automationexercise.com shows a JS alert on submit — accept it
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.page.locator(CONTACT_SELECTORS.submitButton).click();
  }

  /** Assert the success message is displayed after submission. */
  async assertSuccessMessage(): Promise<void> {
    await expect(
      this.page.locator(CONTACT_SELECTORS.successMessage)
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      this.page.locator(CONTACT_SELECTORS.successMessage)
    ).toContainText('Success');
  }

  /** Click the Home button after submission. */
  async clickHome(): Promise<void> {
    await this.page.locator(CONTACT_SELECTORS.homeButton).click();
  }

  /**
   * Full happy-path flow: fill + submit + assert success.
   */
  async submitContactForm(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<void> {
    await this.fillForm(data);
    await this.submitForm();
    await this.assertSuccessMessage();
  }
}
