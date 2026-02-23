import { defineConfig } from 'cypress'
import { config as loadEnv } from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load E2E env from file (local); CI sets these via workflow env / secrets
loadEnv({ path: '.env.e2e' })
loadEnv({ path: '.env.e2e.local' })

function formatFetchError(err: unknown, base: string, step: string): string {
  const e = err instanceof Error ? err : new Error(String(err))
  const cause = e.cause instanceof Error ? e.cause : null
  const code = cause && 'code' in cause ? (cause as NodeJS.ErrnoException).code : (e as NodeJS.ErrnoException).code
  const detail = cause?.message ?? e.message
  return `getOtpByRequestId: ${step} request failed (${base}). ${code ? `Code: ${code}. ` : ''}${detail}`
}

function buildPerformanceHtml(report: {
  generatedAt: string
  requests: Array<{ url: string; method: string; duration: number; status: number; label: string }>
  screenDurations: Array<{ screen: string; durationMs: number }>
}): string {
  const requests = report.requests
  const screens = report.screenDurations
  const reqLabels = requests.map((r) => r.label)
  const reqDurations = requests.map((r) => r.duration)
  const screenLabels = screens.map((s) => s.screen)
  const screenDurations = screens.map((s) => Math.round(s.durationMs))

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>E2E Performance Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1rem 2rem; max-width: 1200px; }
    h1 { font-size: 1.5rem; }
    .meta { color: #666; margin-bottom: 1.5rem; }
    .chart-container { position: relative; height: 320px; margin-bottom: 2rem; }
    table { border-collapse: collapse; width: 100%; margin-top: 0.5rem; }
    th, td { border: 1px solid #ddd; padding: 0.4rem 0.75rem; text-align: left; }
    th { background: #f5f5f5; }
    tr:nth-child(even) { background: #fafafa; }
    .section { margin-bottom: 2rem; }
  </style>
</head>
<body>
  <h1>E2E Performance Report</h1>
  <p class="meta">Generated at ${report.generatedAt}</p>

  <div class="section">
    <h2>Request / response times (ms)</h2>
    <div class="chart-container"><canvas id="requestsChart"></canvas></div>
    <table>
      <thead><tr><th>Method</th><th>URL</th><th>Duration (ms)</th><th>Status</th></tr></thead>
      <tbody>
        ${requests.map((r) => `<tr><td>${r.method}</td><td title="${r.url.replace(/"/g, '&quot;')}">${r.label}</td><td>${r.duration}</td><td>${r.status}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Time per screen (ms)</h2>
    <div class="chart-container"><canvas id="screensChart"></canvas></div>
    <table>
      <thead><tr><th>Screen</th><th>Duration (ms)</th></tr></thead>
      <tbody>
        ${screens.map((s) => `<tr><td>${s.screen}</td><td>${Math.round(s.durationMs)}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>

  <script>
    const reqData = ${JSON.stringify({ labels: reqLabels, values: reqDurations })};
    const screenData = ${JSON.stringify({ labels: screenLabels, values: screenDurations })};

    new Chart(document.getElementById('requestsChart'), {
      type: 'bar',
      data: {
        labels: reqData.labels,
        datasets: [{ label: 'Response time (ms)', data: reqData.values, backgroundColor: 'rgba(54, 162, 235, 0.6)' }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { beginAtZero: true } },
        plugins: { legend: { display: false } }
      }
    });

    new Chart(document.getElementById('screensChart'), {
      type: 'bar',
      data: {
        labels: screenData.labels,
        datasets: [{ label: 'Time on screen (ms)', data: screenData.values, backgroundColor: 'rgba(75, 192, 192, 0.6)' }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: false } }
      }
    });
  </script>
</body>
</html>
`
}

/**
 * E2E tests run against the app URL (configurable via CYPRESS_BASE_URL).
 * Use admin credentials (CYPRESS_ADMIN_EMAIL, CYPRESS_ADMIN_PASSWORD) and
 * API base (CYPRESS_API_BASE_URL) for OTP retrieval in phone signup tests.
 * Set in .env.e2e (see .env.e2e.example) or pass in the run command / CI.
 */
export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    // Disable web security so the browser allows cross-origin requests (e.g. app on localhost → API).
    // Only applies to Chrome-based browsers (Chrome, Edge, Electron). Firefox/WebKit do not support this.
    chromeWebSecurity: false,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: Number(process.env.CYPRESS_VIEWPORT_WIDTH) || 1280,
    viewportHeight: Number(process.env.CYPRESS_VIEWPORT_HEIGHT) || 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 15000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // Optional: read env from cypress.env.json or keep using process.env
      config.env = config.env || {}
      if (process.env.CYPRESS_API_BASE_URL)
        config.env.apiBaseUrl = process.env.CYPRESS_API_BASE_URL
      if (process.env.CYPRESS_ADMIN_EMAIL)
        config.env.adminEmail = process.env.CYPRESS_ADMIN_EMAIL
      if (process.env.CYPRESS_ADMIN_PASSWORD)
        config.env.adminPassword = process.env.CYPRESS_ADMIN_PASSWORD

      const phoneStatePath = path.join(process.cwd(), 'cypress', 'e2e-phone-state.json')
      const PHONE_START = 670000000

      on('task', {
        /** Returns next unused national phone number (e.g. 670000001) and persists it in cypress/e2e-phone-state.json. */
        getNextTestPhone(): string {
          let lastUsed = PHONE_START - 1
          try {
            const raw = fs.readFileSync(phoneStatePath, 'utf-8')
            const data = JSON.parse(raw) as { lastUsed?: number }
            if (typeof data?.lastUsed === 'number') lastUsed = data.lastUsed
          } catch {
            // file missing or invalid: start from PHONE_START
          }
          const next = lastUsed + 1
          fs.writeFileSync(phoneStatePath, JSON.stringify({ lastUsed: next }, null, 2), 'utf-8')
          return String(next)
        },

        async getOtpByRequestId({ requestId }: { requestId: string }) {
          const apiBase = process.env.CYPRESS_API_BASE_URL || config.env?.apiBaseUrl
          const adminEmail = process.env.CYPRESS_ADMIN_EMAIL || config.env?.adminEmail
          const adminPassword = process.env.CYPRESS_ADMIN_PASSWORD || config.env?.adminPassword
          if (!apiBase || !adminEmail || !adminPassword) {
            throw new Error(
              'Missing CYPRESS_API_BASE_URL, CYPRESS_ADMIN_EMAIL, or CYPRESS_ADMIN_PASSWORD'
            )
          }
          const base = apiBase.replace(/\/$/, '')
          let authRes: Response
          try {
            authRes = await fetch(`${base}/v2/api/public/users/authenticate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                authFactors: [
                  {
                    type: 'FACTOR_TYPE_EMAIL_PASSWORD',
                    id: adminEmail,
                    secretValue: adminPassword,
                  },
                ],
              }),
            })
          } catch (err) {
            const msg = formatFetchError(err, base, 'auth')
            throw new Error(msg)
          }
          if (!authRes.ok) {
            const text = await authRes.text()
            throw new Error(`Admin login failed: ${authRes.status} ${text}`)
          }
          const auth = (await authRes.json()) as { userId?: string; tokens?: { accessToken?: string } }
          const userId = auth?.userId
          const token = auth?.tokens?.accessToken
          if (!userId || !token) {
            throw new Error('Admin authenticate did not return userId or accessToken')
          }
          let otpRes: Response
          try {
            otpRes = await fetch(
              `${base}/v2/api/admin/user/${encodeURIComponent(userId)}/users/get-otp-by-request-id/${encodeURIComponent(requestId)}`,
              {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
              }
            )
          } catch (err) {
            const msg = formatFetchError(err, base, 'get-otp')
            throw new Error(msg)
          }
          if (!otpRes.ok) {
            const text = await otpRes.text()
            throw new Error(`Get OTP failed: ${otpRes.status} ${text}`)
          }
          const otpData = (await otpRes.json()) as { secretValue?: string }
          const otp = otpData?.secretValue
          if (!otp) {
            throw new Error('Get OTP response did not contain secretValue')
          }
          return { otp }
        },

        /**
         * Set a test user's email via complete-profile so they can be identified and deleted.
         * Call after signup when the user has no email yet (e.g. phone signup).
         */
        async setTestUserEmail({
          userId,
          accessToken,
          email,
        }: {
          userId: string
          accessToken: string
          email: string
        }) {
          const apiBase = process.env.CYPRESS_API_BASE_URL || config.env?.apiBaseUrl
          if (!apiBase) {
            throw new Error('Missing CYPRESS_API_BASE_URL for setTestUserEmail')
          }
          const base = apiBase.replace(/\/$/, '')
          const res = await fetch(
            `${base}/v2/api/client/users/${encodeURIComponent(userId)}/complete-profile`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ email }),
            }
          )
          if (!res.ok) {
            const text = await res.text()
            throw new Error(`Complete profile failed: ${res.status} ${text}`)
          }
          return { ok: true }
        },

        /** Write performance report (requests + time per screen) to cypress/reports/ and return the report path. */
        writePerformanceReport(payload: {
          requests: Array<{ url: string; method: string; duration: number; status: number }>
          screenTimes: Array<{ screen: string; timestamp: number }>
        }): string {
          const reportsDir = path.join(process.cwd(), 'cypress', 'reports')
          if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true })
          const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
          const jsonPath = path.join(reportsDir, `performance-${ts}.json`)

          const { requests, screenTimes } = payload
          const sorted = [...screenTimes].sort((a, b) => a.timestamp - b.timestamp)
          const screenDurations: Array<{ screen: string; durationMs: number }> = []
          for (let i = 0; i < sorted.length - 1; i++) {
            screenDurations.push({
              screen: sorted[i].screen,
              durationMs: sorted[i + 1].timestamp - sorted[i].timestamp,
            })
          }

          const report = {
            generatedAt: new Date().toISOString(),
            requests: requests.map((r) => ({
              ...r,
              label: r.url.length > 60 ? r.url.slice(0, 57) + '...' : r.url,
            })),
            screenDurations,
          }
          fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8')

          const html = buildPerformanceHtml(report)
          const htmlPath = path.join(reportsDir, `performance-${ts}.html`)
          fs.writeFileSync(htmlPath, html, 'utf-8')
          return htmlPath
        },
      })
      return config
    },
  },
})
