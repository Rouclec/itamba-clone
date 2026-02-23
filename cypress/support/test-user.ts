/**
 * Test user email pattern for E2E-created users.
 * All such emails match: e2e-test+*@test.itamba.local
 * so you can find/delete them with: WHERE email LIKE 'e2e-test+%@test.itamba.local'
 */
export const E2E_TEST_EMAIL_DOMAIN = 'test.itamba.local'
export const E2E_TEST_EMAIL_PREFIX = 'e2e-test+'

/**
 * Generate a unique email for a user created during an E2E test.
 * Use this when creating or updating a test user so they can be queried and deleted later.
 */
export function generateTestUserEmail(): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return `${E2E_TEST_EMAIL_PREFIX}${id}@${E2E_TEST_EMAIL_DOMAIN}`
}

/** SQL-like pattern to match all E2E test user emails (e.g. for DELETE or SELECT). */
export const E2E_TEST_EMAIL_LIKE_PATTERN = `${E2E_TEST_EMAIL_PREFIX}%@${E2E_TEST_EMAIL_DOMAIN}`
