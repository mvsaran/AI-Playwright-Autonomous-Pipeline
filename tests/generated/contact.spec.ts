/**
 * contact.spec.ts — Contact Us form tests for https://automationexercise.com
 * Covers: TC-CONTACT-001 through TC-CONTACT-004
 */
import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { ContactPage } from '../../pages/ContactPage';

// Test data isolated for easy updates
const CONTACT_DATA = {
  name: 'Pipeline Test User',
  email: 'pipeline.test@example.com',
  subject: 'Automated Test Inquiry — Pipeline Run',
  message: 'This is an automated test message submitted by the AI-Driven Playwright Pipeline. Please ignore.',
  longMessage: 'A'.repeat(500),
};

test.describe('Contact Us — Automationexercise.com', () => {
  let homePage: HomePage;
  let contactPage: ContactPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    contactPage = new ContactPage(page);
    await homePage.navigate();
    await homePage.assertLoaded();
  });

  // TC-CONTACT-001: Smoke — Contact Us page loads
  test('TC-CONTACT-001: Contact Us page loads with correct heading', async ({ page }) => {
    await contactPage.navigate();
    await contactPage.assertLoaded();
    await expect(page).toHaveURL(/.*contact_us.*/);
  });

  // TC-CONTACT-002: Regression — Navigate to contact from home navbar
  test('TC-CONTACT-002: User can navigate to Contact Us from home nav', async ({ page }) => {
    await homePage.goToContactUs();
    await expect(page).toHaveURL(/.*contact_us.*/);
    await contactPage.assertLoaded();
  });

  // TC-CONTACT-003: Regression — Submit form with valid data shows success
  test('TC-CONTACT-003: Submitting contact form with valid data shows success message', async ({ page }) => {
    await contactPage.navigate();
    await contactPage.assertLoaded();
    await contactPage.submitContactForm({
      name: CONTACT_DATA.name,
      email: CONTACT_DATA.email,
      subject: CONTACT_DATA.subject,
      message: CONTACT_DATA.message,
    });
    await contactPage.assertSuccessMessage();
  });

  // TC-CONTACT-004: Edge — Submit form with a very long message
  test('TC-CONTACT-004: Contact form accepts a very long message without errors', async ({ page }) => {
    await contactPage.navigate();
    await contactPage.assertLoaded();
    await contactPage.submitContactForm({
      name: CONTACT_DATA.name,
      email: CONTACT_DATA.email,
      subject: 'Long Message Edge Case',
      message: CONTACT_DATA.longMessage,
    });
    // Should still show success (site accepts any length message)
    await contactPage.assertSuccessMessage();
  });
});
