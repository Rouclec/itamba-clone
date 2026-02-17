import { SignupProvider } from '@/components/auth/signup-provider'

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SignupProvider>{children}</SignupProvider>
}
