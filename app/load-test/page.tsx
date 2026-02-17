'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  runLoadTest,
  formatLoadTestResults,
  LOAD_TEST_SCENARIOS,
  type LoadTestConfig,
  type LoadTestResult,
} from '@/lib/load-test'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { AlertCircle, Zap } from 'lucide-react'

export default function LoadTestPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<LoadTestResult | null>(null)
  const [scenario, setScenario] = useState<'light' | 'moderate' | 'heavy' | 'extreme' | 'spike'>('moderate')
  const [customConfig, setCustomConfig] = useState<Partial<LoadTestConfig>>({})
  const [useCustom, setUseCustom] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const config = useCustom
    ? ({
        numUsers: customConfig.numUsers || 50,
        duration: customConfig.duration || 60,
        rampUp: customConfig.rampUp || 10,
        endpoint: customConfig.endpoint || '/api/health',
        method: customConfig.method || 'GET',
      } as LoadTestConfig)
    : ({
        ...LOAD_TEST_SCENARIOS[scenario],
        endpoint: '/api/health',
        method: 'GET',
      } as LoadTestConfig)

  const handleRunTest = async () => {
    setError(null)
    setIsRunning(true)

    try {
      const testResults = await runLoadTest(config)
      setResults(testResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run load test')
    } finally {
      setIsRunning(false)
    }
  }

  const chartData = results
    ? [
        { name: 'Success', value: results.successfulRequests, fill: '#10b981' },
        { name: 'Failed', value: results.failedRequests, fill: '#ef4444' },
      ]
    : []

  const responseTimeData = results
    ? [
        { metric: 'Min', time: results.minResponseTime },
        { metric: 'Avg', time: results.averageResponseTime },
        { metric: 'P95', time: results.percentile95 },
        { metric: 'P99', time: results.percentile99 },
        { metric: 'Max', time: results.maxResponseTime },
      ]
    : []

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Load Testing</h1>
          </div>
          <p className="text-muted-foreground">
            Simulate concurrent users and measure your application's performance under load
          </p>
        </div>

        {/* Configuration */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Test Configuration</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustom}
                  onChange={(e) => setUseCustom(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-muted-foreground">Custom Config</span>
              </label>
            </div>

            {!useCustom ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {(Object.keys(LOAD_TEST_SCENARIOS) as Array<keyof typeof LOAD_TEST_SCENARIOS>).map((key) => (
                  <Button
                    key={key}
                    onClick={() => setScenario(key)}
                    variant={scenario === key ? 'default' : 'outline'}
                    className="capitalize"
                  >
                    {key}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Users</label>
                  <Input
                    type="number"
                    value={customConfig.numUsers || 50}
                    onChange={(e) =>
                      setCustomConfig({ ...customConfig, numUsers: parseInt(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Duration (sec)</label>
                  <Input
                    type="number"
                    value={customConfig.duration || 60}
                    onChange={(e) =>
                      setCustomConfig({ ...customConfig, duration: parseInt(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Ramp-up (sec)</label>
                  <Input
                    type="number"
                    value={customConfig.rampUp || 10}
                    onChange={(e) =>
                      setCustomConfig({ ...customConfig, rampUp: parseInt(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Current Config Display */}
          <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
            <p>
              <span className="font-medium">Config:</span> {config.numUsers} users, {config.duration}s duration, {config.rampUp}s ramp-up
            </p>
            <p>
              <span className="font-medium">Endpoint:</span> {config.endpoint}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Run Button */}
          <Button
            onClick={handleRunTest}
            disabled={isRunning}
            className="w-full h-10"
            size="lg"
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Running Load Test...
              </span>
            ) : (
              'Run Load Test'
            )}
          </Button>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-card rounded-lg border border-border space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Total Requests</p>
                <p className="text-2xl font-bold text-foreground">{results.totalRequests}</p>
              </div>
              <div className="p-4 bg-card rounded-lg border border-border space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Success Rate</p>
                <p className={`text-2xl font-bold ${results.errorRate < 5 ? 'text-green-500' : 'text-destructive'}`}>
                  {((100 - results.errorRate).toFixed(1))}%
                </p>
              </div>
              <div className="p-4 bg-card rounded-lg border border-border space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Avg Response</p>
                <p className="text-2xl font-bold text-foreground">{results.averageResponseTime.toFixed(0)}ms</p>
              </div>
              <div className="p-4 bg-card rounded-lg border border-border space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Throughput</p>
                <p className="text-2xl font-bold text-foreground">{results.requestsPerSecond.toFixed(1)}/s</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Success/Failure Pie */}
              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Request Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: `1px solid var(--border)`,
                      }}
                    />
                    <Bar dataKey="value" fill="var(--primary)" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Response Times */}
              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Response Time Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="metric" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: `1px solid var(--border)`,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="time"
                      stroke="var(--primary)"
                      dot={{ r: 4 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Detailed Results</h3>
              <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto text-muted-foreground font-mono">
                {formatLoadTestResults(results)}
              </pre>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">About Load Testing</p>
          <p className="text-sm text-muted-foreground">
            This tool simulates concurrent users making requests to your API. Use it to understand how your application performs under various levels of load and identify potential bottlenecks.
          </p>
        </div>
      </div>
    </main>
  )
}
