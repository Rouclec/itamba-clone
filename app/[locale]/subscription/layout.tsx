'use client'

import { Suspense } from 'react'
import { SubscriptionLayoutClient } from './subscription-layout-client'

function SubscriptionLayoutFallback({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4 lg:px-20">
        <div className="h-11 w-12 shrink-0 bg-muted rounded" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-16 rounded bg-muted" />
          <div className="h-9 w-24 rounded bg-muted" />
        </div>
      </header>
      <main className="min-h-0 flex-1">{children}</main>
      <footer className="shrink-0 border-t border-border py-4 text-center text-lg font-normal text-body-text">
        <span className="text-muted-foreground">…</span>
      </footer>
    </div>
  )
}

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<SubscriptionLayoutFallback>{children}</SubscriptionLayoutFallback>}>
      <SubscriptionLayoutClient>{children}</SubscriptionLayoutClient>
    </Suspense>
  )
}
