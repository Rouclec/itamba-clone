# E2E Test Plan: Browse Library & Subscription Flows

This document lists all **exclusive** E2E test suites and scenarios. Each suite is implemented in its own spec file (or focused describe blocks) so you can run flows independently.

---

## 1. Browse library as guest (restrictions)

**Spec:** `cypress/e2e/browse-library-guest.cy.ts`

- **Goal:** Browse the library as a guest (logged-in user with guest role) and ensure all restrictions are applied.
- **Flow:** Sign up (or log in as guest) → land on `/client` → see guest first-login modal (or dismiss if already seen) → browse catalogues/documents → hit limits and see restriction modals (documents limit, catalogues limit, bookmarks limit, notes limit).
- **Assertions:**
  - Guest first-login modal appears for new guest (or Upgrade CTA visible).
  - When exceeding documents/catalogues/bookmarks/notes limits, restriction modal appears with Upgrade CTA.
  - Upgrade CTA navigates to `/subscription`.

**Edge cases (same spec or dedicated):**
- Guest with `GUEST_FIRST_LOGIN_MODAL_SEEN_KEY` already set: no first-login modal; can still trigger other restriction modals.

---

## 2. Subscription flow: Professional

**Spec:** `cypress/e2e/subscription-professional.cy.ts`

- **Goal:** Subscribe as a **professional** (one payment method; full flow to “subscribed” state).
- **Flow:** Log in (or sign up) → go to `/subscription` → choose **Pay monthly** or **Pay yearly** → click **Get Professional** → `/subscription/payment` → select one payment method (e.g. Mobile Money) → fill phone/email → confirm payment (stub API so no real charge) → redirect to processing/success → browse library as subscribed user (no guest limits).
- **Assertions:** Plan selection, payment page with correct plan, success/processing, then `/client` with professional role (or no restriction modals).

---

## 3. Subscription flow: Student (KYC)

**Spec:** `cypress/e2e/subscription-student.cy.ts`

- **Goal:** Subscribe as a **student** and complete the **student KYC** flow.
- **Flow:** Log in → `/subscription` → click **Get Student** → payment (stub) → success redirects to `/profile/complete/student` → fill school name, location, academic year (From/To) → step 2: choose document type, upload file (fixture) → submit KYC → success page → go to `/client`.
- **Assertions:** KYC form step 1 and 2, file upload, success redirect, then library accessible.

---

## 4. Payment methods (3 exclusive flows)

**Spec:** `cypress/e2e/subscription-payment-methods.cy.ts` (or 3 specs)

- **Goal:** Test each payment method without actually charging.
- **Flows:**
  1. **Mobile Money:** Select Mobile Money → enter valid phone → confirm → stub `initiatePayment` → assert redirect to processing (or success).
  2. **Orange Money:** Select Orange Money → enter valid phone → confirm → stub → assert redirect.
  3. **Card:** Select Card → enter valid email → confirm → stub (and optionally stub `checkoutUrl` redirect so we don’t leave the app) → assert redirect to processing or Stripe URL.
- **Assertions:** Payment method selection, validation (phone/email), confirm button state, and redirect after stubbed success.

---

## 5. Complete flow in French

**Spec:** `cypress/e2e/browse-library-fr.cy.ts`

- **Goal:** Run the **complete** browse + subscription flow in **French** locale.
- **Flow:** Visit `/fr/...` (e.g. `/fr/auth/signup` or `/fr/client` if logged in) → same steps as guest → subscribe (professional or student) → pay (one method) → browse. All copy and UI in French.
- **Assertions:** French labels (e.g. “Payer mensuellement”, “Compléter le profil”, “Confirmer le paiement”), correct locale in URL and visible text.

---

## 6. Complete flow on mobile (and responsiveness / accessibility)

**Spec:** `cypress/e2e/browse-library-mobile.cy.ts`

- **Goal:** Same flows (guest browse, subscribe, browse as subscribed) on **mobile** viewport; optionally basic **accessibility** checks for responsiveness.
- **Flow:** Set viewport to mobile (e.g. 375×667) → run guest browse and/or subscription flow.
- **Assertions:**
  - Key elements visible and clickable (no overflow hiding primary CTAs).
  - Optional: run `cypress-axe` or similar to check focusable elements, touch targets, or contrast (if you add the plugin). Alternatively, assert that restriction modal, subscription plans, and payment form are usable (buttons in view, forms focusable).

---

## 7. Notes: all editing options

**Spec:** `cypress/e2e/notes-editing.cy.ts`

- **Goal:** Create a note and test **all** editing options in the note editor (TipTap toolbar).
- **Flow:** Log in as subscribed user → go to a document (e.g. `/client` → open a document) → open “My notes” → Add note → use toolbar: Bold, Italic, Underline, Strikethrough, Code, Heading 1–5, Blockquote, Bullet list, Ordered list, Link (with dialog), Align left/center/right/justify, Table (insert, add row/column), Horizontal rule → save note.
- **Assertions:** Note saves; content reflects the formatting (e.g. bold text, list, table) when viewing the note or in the viewer.

---

## 8. Edge cases (validation & backend rejection)

**Spec:** `cypress/e2e/edge-cases.cy.ts`

- **Wrong OTP (backend rejection):** Signup phone flow → enter **invalid OTP** (e.g. `000000`) → expect error message or no progression; do not proceed to password step.
- **Invalid email (validation):** On payment page with Card selected → enter invalid email (e.g. `notanemail`) → expect client-side validation message; confirm button disabled or error shown.
- **Invalid phone (validation):** On payment page with Mobile/Orange → enter too-short or invalid phone → expect validation message.
- **Empty required fields:** Submit signup/complete-profile/payment with empty required fields → expect validation or disabled submit.
- **Optional:** Expired or invalid token when accessing `/client`; try to access paid content without subscription; wrong KYC document type or missing file.

---

## Running specific suites

```bash
# Guest + restrictions only
npx cypress run --spec "cypress/e2e/browse-library-guest.cy.ts"

# Subscription professional
npx cypress run --spec "cypress/e2e/subscription-professional.cy.ts"

# Student + KYC
npx cypress run --spec "cypress/e2e/subscription-student.cy.ts"

# All 3 payment methods
npx cypress run --spec "cypress/e2e/subscription-payment-methods.cy.ts"

# French flow
npx cypress run --spec "cypress/e2e/browse-library-fr.cy.ts"

# Mobile
npx cypress run --spec "cypress/e2e/browse-library-mobile.cy.ts" --config viewportWidth=375,viewportHeight=667

# Notes editing
npx cypress run --spec "cypress/e2e/notes-editing.cy.ts"

# Edge cases
npx cypress run --spec "cypress/e2e/edge-cases.cy.ts"
```

---

## Authentication for subscription / payment / notes tests

Subscription, payment, and notes specs assume a **logged-in user**. The subscription page redirects to `/auth/signup` when not authenticated. You can:

1. **Run signup first in the same run:** Use a `before()` hook that runs the full phone signup flow (or a shortened login) so the session has a user, then run the subscription tests in the same spec.
2. **Add a `cy.login()` command:** Implement a custom command that visits `/[locale]/auth/signin`, fills email and password for a test user, and submits. Call `cy.login()` in `beforeEach` or `before()` for subscription, payment, notes, and guest specs that need an existing user.
3. **Seed a session:** Log in once, then preserve the session (e.g. `cypress-localstorage-commands` or set cookies/localStorage) and restore it in specs (see Cypress docs on session handling).

Until then, run subscription/payment tests manually after logging in, or add a login/signup step at the start of each spec.
- **Payment:** Stub `POST **/payments/initiate**` (and optionally subscription create) to return success so no real Stripe/PawaPay call. Card flow can stub `checkoutUrl` to stay in-app or allow redirect for manual check.
- **Student KYC:** Use a small fixture file (e.g. `cypress/fixtures/sample-student-doc.pdf`) for document upload.
- **Notes:** Requires at least one document in the library; use seed data or API to ensure a document exists for the test user.

---

## data-testid and selectors

- Subscription: `subscription-plan-professional`, `subscription-plan-student`, `subscription-toggle-yearly`, `subscription-cta-professional`, `subscription-cta-student`.
- Payment: `payment-method-mobile_money`, `payment-method-orange_money`, `payment-method-card`, `payment-confirm`, `payment-phone-input`, `payment-email-input`.
- Restriction modal: `restriction-modal-upgrade`.
- Notes: `note-editor-save`, `note-editor-cancel`, and optionally toolbar buttons (e.g. `note-toolbar-bold`) if you add them.

These are added in the app where needed for stable E2E selectors.
