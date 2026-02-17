'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error for monitoring
    console.error('Error caught by boundary:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <AlertCircle className="w-16 h-16 text-destructive" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground">
            We encountered an error while processing your request. Please try again.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm font-mono text-destructive">{error.message}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={reset} className="flex-1">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="flex-1">
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}
