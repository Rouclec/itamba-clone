import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { Lato } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { QueryProvider } from '@/components/providers/query-provider'
import { InitInterceptors } from '@/components/init-interceptors'
import { CurrentUserFetcher } from '@/components/current-user-fetcher'
import './globals.css'

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lato',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Itamba - Legal Library',
  description: 'Your online legal library with well-organized and up-to-date Cameroon law',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0047AB',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${lato.variable} font-sans antialiased bg-background text-foreground`} suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <InitInterceptors />
            <CurrentUserFetcher />
            {children}
          </AuthProvider>
        </QueryProvider>
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
