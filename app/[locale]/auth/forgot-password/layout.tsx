'use client';

import { ForgotPasswordProvider } from '@/contexts/forgot-password-context';

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ForgotPasswordProvider>{children}</ForgotPasswordProvider>;
}
