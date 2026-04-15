# Feature: Automation Exercise — End-to-End Test Coverage

## Overview

The target application is **https://automationexercise.com** — a publicly available e-commerce demo site used for test automation practice.

This document defines the functional requirements that the AI pipeline must analyze, plan, and generate tests for.

---

## Modules in Scope

### 1. Authentication (auth)

**Requirement:** Users must be able to register a new account, log in with valid credentials, and log out successfully.

**Acceptance Criteria:**
- AC-AUTH-01: A new user can navigate to the signup/login page from the home page.
- AC-AUTH-02: A new user can register with a unique email and valid credentials.
- AC-AUTH-03: A registered user can log in with correct email and password.
- AC-AUTH-04: Login with incorrect password shows an error message — user is NOT authenticated.
- AC-AUTH-05: Login with a non-existent email shows an error message.
- AC-AUTH-06: Login with empty fields shows appropriate validation.
- AC-AUTH-07: A logged-in user can log out and is redirected appropriately.

**Edge Cases:**
- Email with extra whitespace in login field.
- Password that is just spaces.
- Re-login after logout.

**Negative Scenarios:**
- Invalid password for valid account.
- Non-existent email.
- Empty email field.
- Empty password field.

---

### 2. Product Browsing (products)

**Requirement:** Users must be able to browse the product catalogue, search for products, and view product details.

**Acceptance Criteria:**
- AC-PROD-01: The products page loads and displays a list of products.
- AC-PROD-02: Each product shows a name and price.
- AC-PROD-03: A user can click on a product to view its detail page.
- AC-PROD-04: The product detail page shows name, category, price, availability, and condition.
- AC-PROD-05: A user can search for a product by name using the search bar.
- AC-PROD-06: Search returns relevant results.
- AC-PROD-07: Searching for a non-existent product returns an empty or "no results" state.

**Edge Cases:**
- Search with partial product name.
- Search with all caps.

**Negative Scenarios:**
- Search with special characters.
- Search with empty string (verify no crash).

---

### 3. Cart (cart)

**Requirement:** Users must be able to add products to the cart and verify the cart contents.

**Acceptance Criteria:**
- AC-CART-01: A user can add a product to the cart from the products page.
- AC-CART-02: The cart icon/count updates after adding a product.
- AC-CART-03: Navigating to the cart shows the added product.
- AC-CART-04: The cart shows product name, price, and quantity.
- AC-CART-05: A user can proceed to checkout from the cart (navigation validated, not full purchase flow).

**Edge Cases:**
- Adding the same product twice.

**Negative Scenarios:**
- Navigating to cart when empty — verify graceful display.

---

### 4. Contact Us (contact)

**Requirement:** Users must be able to submit the Contact Us form.

**Acceptance Criteria:**
- AC-CONTACT-01: The Contact Us page loads correctly.
- AC-CONTACT-02: The form accepts name, email, subject, and message.
- AC-CONTACT-03: Submitting the form with valid data shows a success message.
- AC-CONTACT-04: The page has a visible heading "Contact Us" or "Get In Touch".

**Edge Cases:**
- Very long message input.

**Negative Scenarios:**
- Submitting with empty required fields (if client-side validation is present).

---

### 5. Home Page (home)

**Requirement:** The home page must load correctly and show key navigation elements.

**Acceptance Criteria:**
- AC-HOME-01: The home page loads at https://automationexercise.com.
- AC-HOME-02: The navigation bar is visible with links (Home, Products, Cart, Login, etc.).
- AC-HOME-03: The site logo or brand name is visible.
- AC-HOME-04: Featured products or banners are visible on the page.
- AC-HOME-05: Page title is "Automation Exercise".

---

## Non-Functional Requirements

- All tests must run headlessly in CI.
- Tests must not depend on a pre-existing account (register fresh or use known test credentials).
- Locators must be isolated in page objects for easy maintenance.
- Tests must produce screenshots and traces on failure.
- The full pipeline must complete within a reasonable CI time limit (~10 minutes).

---

## Autonomous Pipeline Requirements

- The pipeline must run without human intervention after triggering.
- Failures must be automatically classified into typed categories.
- Self-healing must only apply safe, test-side fixes.
- A quality gate must determine pipeline pass/fail.
- A final summary report must be human-readable.

---

## Known Risks

- automationexercise.com may show ad popups or overlays — tests must handle or dismiss them.
- Selectors on this site are not guaranteed stable across updates.
- The site has no official API — all testing is UI-based.
- Email uniqueness for registration tests requires dynamic generation.

---

## Out of Scope

- Payment processing.
- Order history beyond cart.
- Admin panel.
- Third-party integrations.
