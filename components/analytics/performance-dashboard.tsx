'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Button } from '@/components/ui/button'
import {
  getStoredMetrics,
  getAverageMetrics,
  getMetricsByTimePeriod,
  clearMetrics,
  type StoredMetrics,
} from '@/lib/performance-monitor'
import { Trash2, RefreshCw } from 'lucide-react'

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<StoredMetrics[]>([])
  const [averages, setAverages] = useState<Record<string, number>>({})
  const [timePeriod, setTimePeriod] = useState<24 | 7 | 30>(24)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [timePeriod])

  const loadMetrics = () => {
    setIsLoading(true)
    try {
      const filtered = getMetricsByTimePeriod(timePeriod * 24)
      setMetrics(filtered)
      setAverages(getAverageMetrics())
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadMetrics()
  }

  const handleClearMetrics = () => {
    if (confirm('Are you sure you want to clear all metrics?')) {
      clearMetrics()
      setMetrics([])
      setAverages({})
    }
  }

  // Prepare data for charts
  const chartData = metrics.map((m) => ({
    timestamp: new Date(m.timestamp).toLocaleTimeString(),
    lcp: m.lcp || 0,
    fid: m.fid || 0,
    cls: m.cls || 0,
  }))

  const metricsSummary = [
    {
      name: 'LCP (Largest Contentful Paint)',
      value: averages.lcp?.toFixed(2) || 'N/A',
      unit: 'ms',
      target: '< 2500ms',
      good: (averages.lcp || 0) < 2500,
    },
    {
      name: 'FID (First Input Delay)',
      value: averages.fid?.toFixed(2) || 'N/A',
      unit: 'ms',
      target: '< 100ms',
      good: (averages.fid || 0) < 100,
    },
    {
      name: 'CLS (Cumulative Layout Shift)',
      value: averages.cls?.toFixed(3) || 'N/A',
      unit: '',
      target: '< 0.1',
      good: (averages.cls || 0) < 0.1,
    },
    {
      name: 'FCP (First Contentful Paint)',
      value: averages.fcp?.toFixed(2) || 'N/A',
      unit: 'ms',
      target: '< 1800ms',
      good: (averages.fcp || 0) < 1800,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Performance Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your application's Web Vitals and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={handleClearMetrics}
            variant="outline"
            size="sm"
            className="gap-2 text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-2">
        {([24, 7, 30] as const).map((period) => (
          <Button
            key={period}
            onClick={() => setTimePeriod(period)}
            variant={timePeriod === period ? 'default' : 'outline'}
            size="sm"
          >
            Last {period === 24 ? '24h' : period === 7 ? '7 days' : '30 days'}
          </Button>
        ))}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsSummary.map((metric) => (
          <div
            key={metric.name}
            className="p-4 bg-card rounded-lg border border-border space-y-2"
          >
            <p className="text-sm text-muted-foreground">{metric.name}</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-bold ${metric.good ? 'text-green-500' : 'text-destructive'}`}>
                {metric.value}
              </p>
              <p className="text-xs text-muted-foreground">{metric.unit}</p>
            </div>
            <p className="text-xs text-muted-foreground">Target: {metric.target}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {metrics.length > 0 && (
        <div className="space-y-8">
          {/* Line Chart - Metrics Over Time */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Metrics Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  stroke="var(--muted-foreground)"
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: `1px solid var(--border)`,
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                {chartData.some((d) => d.lcp > 0) && (
                  <Line
                    type="monotone"
                    dataKey="lcp"
                    stroke="var(--primary)"
                    dot={false}
                    name="LCP (ms)"
                  />
                )}
                {chartData.some((d) => d.fid > 0) && (
                  <Line
                    type="monotone"
                    dataKey="fid"
                    stroke="var(--accent)"
                    dot={false}
                    name="FID (ms)"
                  />
                )}
                {chartData.some((d) => d.cls > 0) && (
                  <Line
                    type="monotone"
                    dataKey="cls"
                    stroke="var(--secondary)"
                    dot={false}
                    name="CLS"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Metric Ranges */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">LCP Distribution</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Good (≤2.5s)</span>
                  <span className="text-sm font-semibold text-green-500">
                    {metrics.filter((m) => (m.lcp || 0) <= 2500).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Need Improvement (2.5-4s)</span>
                  <span className="text-sm font-semibold text-yellow-500">
                    {metrics.filter((m) => (m.lcp || 0) > 2500 && (m.lcp || 0) <= 4000).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Poor (&gt;4s)</span>
                  <span className="text-sm font-semibold text-destructive">
                    {metrics.filter((m) => (m.lcp || 0) > 4000).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Session Data</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Total Samples</span>
                  <span className="text-sm font-semibold">{metrics.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Time Span</span>
                  <span className="text-sm font-semibold">{timePeriod} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Last Updated</span>
                  <span className="text-sm font-semibold">
                    {metrics.length > 0
                      ? new Date(metrics[metrics.length - 1].timestamp).toLocaleTimeString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Score */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Performance Score</h3>
              <div className="flex flex-col items-center justify-center h-32">
                <div className="text-4xl font-bold text-primary">
                  {Math.round(
                    ((Math.min(100, (averages.lcp || 0) / 25) +
                      Math.min(100, (averages.fid || 0) / 1) +
                      Math.min(100, (averages.cls || 0) * 100)) /
                      3) *
                      100
                  ) / 100}
                </div>
                <p className="text-xs text-muted-foreground mt-2">out of 100</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {metrics.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-card rounded-lg border border-border border-dashed">
          <p className="text-muted-foreground">
            No metrics collected yet. Use the application to generate performance data.
          </p>
        </div>
      )}
    </div>
  )
}
