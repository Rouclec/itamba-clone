import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl space-y-8 text-center">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary via-purple-500 to-accent rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">I</span>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Itamba
          </h1>
          <p className="text-xl text-muted-foreground">
            Your Online Legal Library
          </p>
        </div>

        {/* Description */}
        <p className="text-lg text-muted-foreground max-w-xl">
          Well organized and up to date Cameroon law. Access comprehensive legal resources at your fingertips.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link href="/auth/signup">
            <Button size="lg" className="min-w-40">
              Sign Up
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="lg" variant="outline" className="min-w-40">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Development Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 text-sm">
          <Link href="/analytics" className="text-primary hover:underline">
            Performance Analytics
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link href="/load-test" className="text-primary hover:underline">
            Load Testing
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
          <div className="p-6 bg-card rounded-lg border border-border">
            <div className="text-3xl mb-2">📚</div>
            <h3 className="font-semibold text-foreground mb-2">Comprehensive</h3>
            <p className="text-sm text-muted-foreground">
              Complete collection of Cameroon laws and legal documents
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg border border-border">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-foreground mb-2">Fast & Reliable</h3>
            <p className="text-sm text-muted-foreground">
              Quick access to the legal information you need
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg border border-border">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-semibold text-foreground mb-2">Secure</h3>
            <p className="text-sm text-muted-foreground">
              Your data is protected with industry-standard security
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
