'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SignupLayout } from '@/components/auth/signup-layout';
import { OTPInputImproved } from '@/components/auth/otp-input-improved';
import { Button } from '@/components/ui/button';
import { useForgotPassword } from '@/contexts/forgot-password-context';
import { useLocalePath } from '@/lib/use-locale';
import { useT } from '@/app/i18n/client';
import { createOtpSchema } from '@/lib/form-validators';
import { toast } from 'sonner';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  userServiceSendResetPasswordOtpMutation,
  userServiceVerifyOtpMutation,
} from '@/@hey_api/users.swagger/@tanstack/react-query.gen';

const INITIAL_RESEND_SECONDS = 30;

export default function ForgotPasswordOtpPage() {
  const router = useRouter();
  const path = useLocalePath();
  const { t } = useT('translation');
  const {
    requestId,
    phoneNumber,
    setForgotPassword,
  } = useForgotPassword();
  const otpSchema = useMemo(() => createOtpSchema(t), [t]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [prevTimeout, setPrevTimeout] = useState(INITIAL_RESEND_SECONDS);
  const [retryCount, setRetryCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!requestId && !phoneNumber) {
      router.replace(path('/auth/forgot-password'));
    }
  }, [requestId, phoneNumber, router, path]);

  const validateOTP = (value: string) => {
    try {
      otpSchema.parse({ otp: value });
      setOtpError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setOtpError(error.errors[0].message);
      }
      return false;
    }
  };

  const { mutateAsync: sendResetOtp } = useMutation({
    ...userServiceSendResetPasswordOtpMutation(),
    onError: () => toast.error(t('auth.failedToResendOtp')),
  });

  const { mutateAsync: verifyOtp } = useMutation({
    ...userServiceVerifyOtpMutation(),
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? t('auth.errorOccurred'));
    },
  });

  const handleOTPComplete = useCallback(
    async (value: string) => {
      if (!validateOTP(value) || !requestId) return;

      setIsLoading(true);
      try {
        const data = await verifyOtp({
          body: {
            authFactor: {
              type: 'FACTOR_TYPE_SMS_OTP',
              id: requestId,
              secretValue: value,
            },
          },
        });

        if (data?.valid) {
          setForgotPassword({ otp: value });
          toast.success(t('auth.otpVerified'));
          router.push(path('/auth/forgot-password/new-password'));
        } else {
          setOtpError(t('auth.invalidOtp'));
        }
      } catch {
        setOtpError(t('auth.errorOccurred'));
      } finally {
        setIsLoading(false);
      }
    },
    [requestId, setForgotPassword, verifyOtp, router, path, t, otpSchema],
  );

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

  const handleResendOTP = async () => {
    if (!phoneNumber) {
      toast.error(t('auth.failedToResendOtp'));
      return;
    }
    try {
      const data = await sendResetOtp({ body: { phoneNumber } });
      const newRequestId = data?.requestId ?? null;
      if (newRequestId) {
        setForgotPassword({ requestId: newRequestId });
      }
      const nextRetryCount = retryCount + 1;
      const nextTimeout =
        retryCount === 0
          ? INITIAL_RESEND_SECONDS
          : 60 * nextRetryCount + prevTimeout;
      setRetryCount(nextRetryCount);
      setPrevTimeout(nextTimeout);
      startResendCountdown(nextTimeout);
      toast.success(t('auth.otpResentSuccess'));
    } catch {
      // onError already shows toast
    }
  };

  const handleBack = () => router.back();

  if (!requestId && !phoneNumber) {
    return null;
  }

  return (
    <SignupLayout
      showProgress={false}
      onBack={handleBack}
      backgroundImage="/assets/password-bg.png"
    >
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div>
          <h2 className="text-xl font-semibold text-primary text-center">
            {t('auth.verifyYourPhone')}
          </h2>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            {t('auth.enterCodeSentTo')}{' '}
            {mounted ? phoneNumber || t('auth.yourPhone') : t('auth.yourPhone')}
          </p>
        </div>

        <OTPInputImproved
          length={6}
          value={otp}
          onChange={setOtp}
          onComplete={handleOTPComplete}
          error={!!otpError}
        />

        <div className="text-base font-medium text-center leading-relaxed">
          <span className="text-body-text">{t('auth.didntReceiveCode')} </span>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resendTimer > 0}
            className={`font-medium hover:underline ${
              resendTimer > 0
                ? 'text-muted-foreground cursor-not-allowed'
                : 'text-secondary'
            }`}
          >
            {resendTimer > 0
              ? t('auth.resendIn', { count: resendTimer })
              : t('auth.resend')}
          </button>
        </div>

        <Button
          onClick={() => handleOTPComplete(otp)}
          disabled={otp.length !== 6 || isLoading}
          className={`w-full h-11 rounded-lg font-semibold text-white cursor-pointer transition-all flex items-center justify-center gap-2 ${
            otp.length !== 6
              ? 'bg-slate-500 cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90 active:bg-primary/80'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {t('auth.verifyingPhone')}
            </span>
          ) : (
            t('auth.verifyPhoneNumber')
          )}
        </Button>

        <div className="text-base font-semibold text-center leading-relaxed">
          <p>
            {t('auth.havingIssues')}{' '}
            <a href="#" className="text-secondary hover:underline">
              {t('common.contactUs')}
            </a>
          </p>
        </div>
      </form>
    </SignupLayout>
  );
}
