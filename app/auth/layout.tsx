import { SignupProvider } from '@/components/auth/signup-provider'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SignupProvider>
      {children}
    </SignupProvider>
  )
}
