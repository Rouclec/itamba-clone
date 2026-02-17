/**
 * Web Vitals and Performance Monitoring
 * Collects and stores performance metrics for analysis
 */

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
}

export interface WebVitals {
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte
}

export interface CustomMetrics {
  formSubmissionTime?: number
  pageTransitionTime?: number
  apiResponseTime?: number
}

export interface StoredMetrics extends WebVitals, CustomMetrics {
  timestamp: number
  url: string
  userAgent: string
}

const METRICS_STORAGE_KEY = 'itamba_performance_metrics'
const MAX_STORED_METRICS = 100

/**
 * Get all stored metrics from localStorage
 */
export function getStoredMetrics(): StoredMetrics[] {
  if (typeof window === 'undefined') return []

  try {
    const data = localStorage.getItem(METRICS_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Save a new metric to localStorage
 */
export function saveMetric(metric: StoredMetrics): void {
  if (typeof window === 'undefined') return

  try {
    const metrics = getStoredMetrics()
    metrics.push(metric)

    // Keep only the last MAX_STORED_METRICS
    const trimmed = metrics.slice(-MAX_STORED_METRICS)
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    console.error('Failed to save metric')
  }
}

/**
 * Clear all stored metrics
 */
export function clearMetrics(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(METRICS_STORAGE_KEY)
  } catch {
    console.error('Failed to clear metrics')
  }
}

/**
 * Get Web Vitals using the web-vitals library
 * Call this function in your root layout
 */
export async function collectWebVitals(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const { getCLS, getFCP, getFID, getLCP, getTTFB } = await import('web-vitals')

    const metrics: Partial<WebVitals> = {}

    getCLS((metric) => {
      metrics.cls = metric.value
      recordMetric('CLS', metric.value, metric.unit || '')
    })

    getFCP((metric) => {
      metrics.fcp = metric.value
      recordMetric('FCP', metric.value, metric.unit || '')
    })

    getFID((metric) => {
      metrics.fid = metric.value
      recordMetric('FID', metric.value, metric.unit || '')
    })

    getLCP((metric) => {
      metrics.lcp = metric.value
      recordMetric('LCP', metric.value, metric.unit || '')
    })

    getTTFB((metric) => {
      metrics.ttfb = metric.value
      recordMetric('TTFB', metric.value, metric.unit || '')
    })
  } catch (error) {
    console.warn('Failed to collect web vitals:', error)
  }
}

/**
 * Record a custom metric
 */
export function recordMetric(name: string, value: number, unit: string = 'ms'): void {
  if (typeof window === 'undefined') return

  const metric: PerformanceMetric = {
    name,
    value,
    unit,
    timestamp: Date.now(),
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}: ${value}${unit}`)
  }

  // Store for analysis
  const storedMetric: StoredMetrics = {
    [name.toLowerCase()]: value,
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  }

  saveMetric(storedMetric)
}

/**
 * Measure execution time of a function
 */
export async function measureExecutionTime<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()

  try {
    const result = await fn()
    const duration = performance.now() - start
    recordMetric(name, duration, 'ms')
    return result
  } catch (error) {
    const duration = performance.now() - start
    recordMetric(`${name}_error`, duration, 'ms')
    throw error
  }
}

/**
 * Get average metrics over time
 */
export function getAverageMetrics(): Record<string, number> {
  const metrics = getStoredMetrics()
  const averages: Record<string, number[]> = {}

  metrics.forEach((metric) => {
    Object.entries(metric).forEach(([key, value]) => {
      if (typeof value === 'number' && key !== 'timestamp') {
        if (!averages[key]) {
          averages[key] = []
        }
        averages[key].push(value)
      }
    })
  })

  const result: Record<string, number> = {}
  Object.entries(averages).forEach(([key, values]) => {
    result[key] = values.reduce((a, b) => a + b, 0) / values.length
  })

  return result
}

/**
 * Get metrics grouped by time period (last hour, day, week)
 */
export function getMetricsByTimePeriod(hoursBack: number = 24): StoredMetrics[] {
  const metrics = getStoredMetrics()
  const cutoffTime = Date.now() - hoursBack * 60 * 60 * 1000

  return metrics.filter((metric) => metric.timestamp >= cutoffTime)
}
