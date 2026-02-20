'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

export type ForgotPasswordMode = 'phone' | 'email';

interface ForgotPasswordState {
  mode: ForgotPasswordMode;
  /** Set when user requested OTP (phone flow). */
  requestId: string | null;
  /** Set after OTP verified (phone flow). */
  otp: string | null;
  /** Set when user requested email link (email flow). */
  email: string | null;
  /** Email verification token (from verify-email); used as authFactor.secretValue for reset. */
  emailVerificationToken: string | null;
  /** Phone number for resend OTP (phone flow). */
  phoneNumber: string | null;
}

interface ForgotPasswordContextValue extends ForgotPasswordState {
  setForgotPassword: (patch: Partial<ForgotPasswordState>) => void;
  clearForgotPassword: () => void;
}

const defaultState: ForgotPasswordState = {
  mode: 'phone',
  requestId: null,
  otp: null,
  email: null,
  emailVerificationToken: null,
  phoneNumber: null,
};

const ForgotPasswordContext = createContext<ForgotPasswordContextValue | null>(null);

export function ForgotPasswordProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ForgotPasswordState>(defaultState);

  const setForgotPassword = useCallback((patch: Partial<ForgotPasswordState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearForgotPassword = useCallback(() => {
    setState(defaultState);
  }, []);

  return (
    <ForgotPasswordContext.Provider
      value={{
        ...state,
        setForgotPassword,
        clearForgotPassword,
      }}
    >
      {children}
    </ForgotPasswordContext.Provider>
  );
}

export function useForgotPassword() {
  const ctx = useContext(ForgotPasswordContext);
  if (!ctx) throw new Error('useForgotPassword must be used within ForgotPasswordProvider');
  return ctx;
}
