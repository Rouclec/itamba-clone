'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SignupLayout } from '@/components/auth/signup-layout';
import { Button } from '@/components/ui/button';
import { useForgotPassword } from '@/contexts/forgot-password-context';
import { useLocalePath } from '@/lib/use-locale';
import { useT } from '@/app/i18n/client';
import { Trans } from 'react-i18next';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { userServiceSendResetPasswordEmailVerificationLinkMutation } from '@/@hey_api/users.swagger/@tanstack/react-query.gen';

const INITIAL_RESEND_SECONDS = 30;

export default function ForgotPasswordEmailSentPage() {
  const router = useRouter();
  const path = useLocalePath();
  const { t } = useT('translation');
  const { email } = useForgotPassword();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [resendTimer, setResendTimer] = useState(0);
  const [prevTimeout, setPrevTimeout] = useState(INITIAL_RESEND_SECONDS);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!email) {
      router.replace(path('/auth/forgot-password'));
    }
  }, [email, router, path]);

  const startResendCountdown = useCallback((seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendTimer(seconds);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  useEffect(() => {
    startResendCountdown(INITIAL_RESEND_SECONDS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startResendCountdown]);

  const { mutateAsync: sendResetEmailLink } = useMutation({
    ...userServiceSendResetPasswordEmailVerificationLinkMutation(),
    onError: () => toast.error(t('auth.failedToResendEmail')),
  });

  const handleResend = async () => {
    if (resendTimer > 0 || !email) return;
    try {
      await sendResetEmailLink({ body: { email } });
      const nextRetryCount = retryCount + 1;
      const nextTimeout =
        retryCount === 0
          ? INITIAL_RESEND_SECONDS
          : 60 * nextRetryCount + prevTimeout;
      setRetryCount(nextRetryCount);
      setPrevTimeout(nextTimeout);
      startResendCountdown(nextTimeout);
      toast.success(t('auth.verificationEmailSentAgain'));
    } catch {
      // onError already shows toast
    }
  };

  const handleBackToSignIn = () => {
    router.push(path('/auth/signin'));
  };

  if (!email) {
    return null;
  }

  return (
    <SignupLayout showProgress={false} showBackButton={false}>
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-primary">
            {t('auth.verifyYourEmail')}
          </h1>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            <Trans
              i18nKey="auth.emailSentTo"
              ns="translation"
              values={{ email }}
              components={{ bold: <strong className="font-bold" /> }}
            />
          </p>
        </div>

        <Button
          type="button"
          onClick={handleBackToSignIn}
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {t('auth.backToSignIn')}
        </Button>

        <div className="text-base font-medium text-center leading-relaxed">
          <span className="text-muted-foreground">
            {t('auth.didntReceiveEmail')}{' '}
          </span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendTimer > 0}
            className={`font-medium underline ${
              resendTimer > 0
                ? 'text-muted-foreground cursor-not-allowed'
                : 'text-secondary'
            }`}
          >
            {resendTimer > 0
              ? t('auth.resendInSeconds', { count: resendTimer })
              : t('auth.resend')}
          </button>
        </div>
      </div>
    </SignupLayout>
  );
}
