/**
 * Load Testing Utilities
 * Simulate concurrent users and measure performance under load
 */

export interface LoadTestConfig {
  numUsers: number
  duration: number // in seconds
  rampUp: number // time to reach full load in seconds
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  payload?: Record<string, unknown>
}

export interface LoadTestResult {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  requestsPerSecond: number
  errorRate: number
  percentile95: number
  percentile99: number
}

interface RequestMetrics {
  responseTime: number
  success: boolean
  timestamp: number
}

/**
 * Simulate a single API request
 */
async function simulateRequest(
  endpoint: string,
  method: string = 'GET',
  payload?: Record<string, unknown>
): Promise<RequestMetrics> {
  const startTime = performance.now()

  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload ? JSON.stringify(payload) : undefined,
    })

    const responseTime = performance.now() - startTime
    return {
      responseTime,
      success: response.ok,
      timestamp: Date.now(),
    }
  } catch (error) {
    const responseTime = performance.now() - startTime
    return {
      responseTime,
      success: false,
      timestamp: Date.now(),
    }
  }
}

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedArray: number[], percentile: number): number {
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1
  return sortedArray[Math.max(0, index)]
}

/**
 * Run a load test simulation
 */
export async function runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
  const {
    numUsers,
    duration,
    rampUp,
    endpoint,
    method = 'GET',
    payload,
  } = config

  const metrics: RequestMetrics[] = []
  const startTime = Date.now()
  const rampUpInterval = (rampUp * 1000) / numUsers
  const testEndTime = startTime + duration * 1000

  const makeRequests = async (userId: number) => {
    const userStartDelay = Math.min(userId * rampUpInterval, rampUp * 1000)
    await new Promise((resolve) => setTimeout(resolve, userStartDelay))

    while (Date.now() < testEndTime) {
      const result = await simulateRequest(endpoint, method, payload)
      metrics.push(result)

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  // Start all user simulations
  const userPromises = Array.from({ length: numUsers }, (_, i) =>
    makeRequests(i).catch(console.error)
  )

  await Promise.all(userPromises)

  // Calculate results
  const successful = metrics.filter((m) => m.success).length
  const failed = metrics.filter((m) => !m.success).length
  const responseTimes = metrics.map((m) => m.responseTime).sort((a, b) => a - b)

  return {
    totalRequests: metrics.length,
    successfulRequests: successful,
    failedRequests: failed,
    averageResponseTime:
      metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length,
    minResponseTime: Math.min(...responseTimes),
    maxResponseTime: Math.max(...responseTimes),
    requestsPerSecond: metrics.length / duration,
    errorRate: (failed / metrics.length) * 100,
    percentile95: calculatePercentile(responseTimes, 95),
    percentile99: calculatePercentile(responseTimes, 99),
  }
}

/**
 * Format load test results for display
 */
export function formatLoadTestResults(result: LoadTestResult): string {
  return `
Load Test Results:
==================
Total Requests: ${result.totalRequests}
Successful: ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%)
Failed: ${result.failedRequests} (${result.errorRate.toFixed(2)}%)

Response Times:
- Average: ${result.averageResponseTime.toFixed(2)}ms
- Min: ${result.minResponseTime.toFixed(2)}ms
- Max: ${result.maxResponseTime.toFixed(2)}ms
- 95th Percentile: ${result.percentile95.toFixed(2)}ms
- 99th Percentile: ${result.percentile99.toFixed(2)}ms

Throughput:
- Requests/sec: ${result.requestsPerSecond.toFixed(2)}
`
}

/**
 * Common load test scenarios
 */
export const LOAD_TEST_SCENARIOS = {
  light: {
    numUsers: 10,
    duration: 30,
    rampUp: 5,
  },
  moderate: {
    numUsers: 50,
    duration: 60,
    rampUp: 10,
  },
  heavy: {
    numUsers: 100,
    duration: 120,
    rampUp: 15,
  },
  extreme: {
    numUsers: 500,
    duration: 180,
    rampUp: 30,
  },
  spike: {
    numUsers: 1000,
    duration: 60,
    rampUp: 5,
  },
}
