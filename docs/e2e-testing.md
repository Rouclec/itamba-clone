# E2E Testing with Cypress

End-to-end tests run in a real browser and support **visualization** (watch tests run, time travel, and inspect DOM). You can run them against any environment by setting the app and API URLs.

## Quick start

```bash
# Install dependencies (includes Cypress)
npm install

# Open Cypress interactive runner (visualize tests in browser)
npm e2e

# Run headless (CI)
npm e2e:run
```

## Configuration

| Env variable | Description | Default |
|-------------|-------------|---------|
| `CYPRESS_BASE_URL` | App URL under test | `http://localhost:3000` |
| `CYPRESS_API_BASE_URL` | Backend API base (for admin OTP task) | — |
| `CYPRESS_ADMIN_EMAIL` | Admin email (for OTP retrieval in phone flows) | — |
| `CYPRESS_ADMIN_PASSWORD` | Admin password | — |
| `CYPRESS_TEST_PHONE` | National phone digits for signup tests | `677000001` |
| `CYPRESS_TEST_PASSWORD` | Password for new test user | `TestPass1` |
| `CYPRESS_TEST_USER_EMAIL` | Email for **browse-only** and **subscription-only** specs (existing user) | — |
| `CYPRESS_VIEWPORT_WIDTH` | Browser width (e.g. `375` for mobile) | `1280` |
| `CYPRESS_VIEWPORT_HEIGHT` | Browser height (e.g. `667` for mobile) | `720` |

### Using an env file (recommended for local)

Cypress loads `.env.e2e` and then `.env.e2e.local` (if present) when the config runs, so you don’t need to pass variables on the command line.

1. Copy the example file and add your values:
   ```bash
   cp .env.e2e.example .env.e2e
   # Edit .env.e2e with real URLs and admin credentials (do not commit)
   ```
2. `.env.e2e` and `.env.e2e.local` are gitignored. Use `.env.e2e.local` for machine-specific overrides.

Then run `npm run e2e` or `npm run e2e:run`; no extra env flags needed.

### Command line (override or one-off)

You can still override or set variables when running:

```bash
CYPRESS_BASE_URL=https://dev.example.com npm run e2e:run
```

### GitHub Actions (CI)

In CI you should **not** commit `.env.e2e` with secrets. Use repository (or environment) secrets and pass them as env to the job. The same variable names are read from `process.env`, so they work whether set by the env file (local) or by the workflow (CI).

Example workflow step:

```yaml
- name: Run E2E tests
  env:
    CYPRESS_BASE_URL: ${{ secrets.CYPRESS_BASE_URL }}
    CYPRESS_API_BASE_URL: ${{ secrets.CYPRESS_API_BASE_URL }}
    CYPRESS_ADMIN_EMAIL: ${{ secrets.CYPRESS_ADMIN_EMAIL }}
    CYPRESS_ADMIN_PASSWORD: ${{ secrets.CYPRESS_ADMIN_PASSWORD }}
  run: npm run e2e:run
```

Add `CYPRESS_BASE_URL`, `CYPRESS_API_BASE_URL`, `CYPRESS_ADMIN_EMAIL`, and `CYPRESS_ADMIN_PASSWORD` (and optionally `CYPRESS_TEST_PHONE`, `CYPRESS_TEST_PASSWORD`) in the repo’s **Settings → Secrets and variables → Actions**.

## Visualization and performance

- **Interactive runner** (`npm run e2e`): Opens the Cypress UI. Choose a spec and watch it run in a browser; you get command log, DOM snapshot, and network for each step.
- **Where to see performance (Cypress Open)**:
  - **Command log (left panel)**: Each command shows its **duration** on the right (e.g. `234ms`, `1.2s`). That is the main built-in performance view.
  - **Performance summary**: The signup spec logs total test duration at the end as a `⏱ Total test duration` log entry in the command log.
  - **Performance report (HTML)**: After the signup test runs, an HTML report is written to `cypress/reports/performance-<timestamp>.html`. Open it in a browser to see:
    - **Request/response times**: Bar chart of every HTTP request (URL vs duration in ms) and a table with method, URL, duration, status.
    - **Time per screen**: Bar chart of time spent on each step (signup-phone, signup-otp, signup-password, signup-career, signup-success, complete-profile, client).
  - **Network tab**: In the runner, open the "Network" or request details for any step to see request/response times.
- **Video**: By default Cypress records video for each run (see `cypress.config.ts`). Find it in `cypress/videos/` after `e2e:run`.
- **Screenshots**: On failure, screenshots are saved to `cypress/screenshots/`.
- **Load time**: Support file `cypress/support/e2e.ts` wires a simple load-time hook. You can use `cy.getPageLoadTime()` in specs to log or assert on it. For richer metrics (LCP, FID, etc.) consider adding `cypress-performance` or reading `window.performance.getEntriesByType('navigation')` in a custom command.

## Happy path (full E2E in one run)

To run the **full happy path** end-to-end in a single test (signup → complete profile → sign in → browse library → subscription), use:

```bash
make e2e-happy-path
```

This runs `cypress/e2e/happy-path.cy.ts`, which reuses the same steps as the existing signup, auth, browse, and subscription specs—all in one flow so the session is preserved. Prerequisites are the same as for the signup flow (API, admin OTP, phone state file).

## Running tests independently

You can run **only auth**, **only browse library**, or **only subscription** so each flow is tested in isolation (each spec logs in at the start when it needs a user).

| What to test | Command | Prerequisites |
|--------------|---------|---------------|
| **Authentication only** (signup → complete profile → sign out → sign in) | `make e2e-auth` | Same as signup (API, admin OTP, phone state) |
| **Browse library only** (documents, catalogues, notes, bookmarks) | `make e2e-browse` | Set `CYPRESS_TEST_USER_EMAIL` and `CYPRESS_TEST_PASSWORD` (existing user) |
| **Subscription only** (plans, payment page) | `make e2e-subscription` | Set `CYPRESS_TEST_USER_EMAIL` and `CYPRESS_TEST_PASSWORD` |
| **Full signup + sign-in** (phone signup, complete profile, then sign out and sign in with email) | `npx cypress run --spec "cypress/e2e/signup-phone.cy.ts"` or `make e2e-run` with spec | Same as auth |

- **Auth-only** and **signup-phone** create a new user and (in signup-phone) verify sign-in right after signup.
- **Browse-only** and **subscription-only** use the custom command `cy.login(email, password)` in `beforeEach`; set the env vars in `.env.e2e.local` or `cypress.env.json`.

## Mobile viewport (automatic)

The browser can run in **mobile size automatically**—you don’t set it manually.

1. **In a specific spec**  
   The mobile spec already sets the viewport in code:
   ```ts
   beforeEach(() => {
     cy.viewport(375, 667)
     // ...
   })
   ```
   So when you run `cypress/e2e/browse-library-mobile.cy.ts`, the runner uses a 375×667 viewport for those tests.

2. **For the whole run**  
   Use the Makefile:
   ```bash
   make e2e-mobile
   ```
   which runs the mobile spec with `CYPRESS_VIEWPORT_WIDTH=375` and `CYPRESS_VIEWPORT_HEIGHT=667`. You can use the same env for any run:
   ```bash
   CYPRESS_VIEWPORT_WIDTH=375 CYPRESS_VIEWPORT_HEIGHT=667 make e2e-run
   ```

## Test suites

See **[E2E Test Plan](e2e-test-plan.md)** for the full list of exclusive suites: guest browse (restrictions), subscription professional/student, payment methods (Mobile Money, Orange Money, Card), French locale, mobile viewport, notes editing, and edge cases (validation, wrong OTP).

### Phone signup (`cypress/e2e/signup-phone.cy.ts`)

1. Visits signup, enters phone, submits.
2. Intercepts `send-signup-otp` response to get `requestId`.
3. Uses a **Cypress task** to log in as admin and call the backend `getOtpByRequestId` API, then returns the OTP.
4. Types the OTP, then completes password and career steps until the success page.
5. Completes profile (full name, email, location), then **signs out** and **signs in** with the same email/password to confirm the sign-in flow works.

Requires `CYPRESS_API_BASE_URL`, `CYPRESS_ADMIN_EMAIL`, and `CYPRESS_ADMIN_PASSWORD` to be set so the task can retrieve the OTP.

## Test user identification and cleanup

E2E-created users are tagged with a **patterned email** so you can query and delete them after test runs.

- **Pattern:** `e2e-test+{uniqueId}@test.itamba.local`
- **Flow:** After phone signup reaches the success page, the test calls the backend **complete-profile** API to set the new user’s email to this value. (For future email signup tests, use the same pattern as the signup email.)

**Find or delete test users (example):**

- **SQL:** `WHERE email LIKE 'e2e-test+%@test.itamba.local'`
- **Example cleanup:** `DELETE FROM users WHERE email LIKE 'e2e-test+%@test.itamba.local';` (adjust table/column to your schema)

Constants and helper live in `cypress/support/test-user.ts` (`E2E_TEST_EMAIL_LIKE_PATTERN`, `generateTestUserEmail()`).

## Load testing (future)

For load testing with many concurrent users and per-user performance visualization, consider a dedicated tool (e.g. k6, Artillery) or Cypress Cloud with parallelization. The current setup is focused on single-user E2E and visualization in the Cypress UI.
