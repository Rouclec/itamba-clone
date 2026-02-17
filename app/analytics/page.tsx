import { PerformanceDashboard } from '@/components/analytics/performance-dashboard'

export const metadata = {
  title: 'Performance Analytics | Itamba',
  description: 'Monitor your application performance metrics',
}

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <PerformanceDashboard />
      </div>
    </main>
  )
}
