"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignupLayout } from "@/components/auth/signup-layout";
import { Button } from "@/components/ui/button";
import { useSignupContext } from "@/lib/signup-context";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { mockSendEmailVerification } from "@/lib/mock-api";
import { toast } from "sonner";

const LONG_PRESS_MS = 700;
const MOCK_VERIFY_TOKEN = "mock_skip";

export default function EmailSentPage() {
  const router = useRouter();
  const path = useLocalePath();
  const { t } = useT('translation');
  const { formData } = useSignupContext();
  const email = formData.email || "";

  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!email) {
      router.replace(path("/auth/signup/email"));
    }
  }, [email, router, path]);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleLongPressStart = () => {
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      router.push(path(`/auth/signup/email/verify?token=${MOCK_VERIFY_TOKEN}`));
    }, LONG_PRESS_MS);
  };

  const handleLongPressEnd = () => {
    clearLongPressTimer();
  };

  const handleGoBackToSignUp = () => {
    router.push(path("/auth/signup/email"));
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setIsResending(true);
    try {
      const result = await mockSendEmailVerification(email);
      if (result.success) {
        setResendTimer(60);
        const interval = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        toast.success(t('auth.verificationEmailSentAgain'));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(t('auth.failedToResendEmail'));
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <SignupLayout showProgress={false} showBackButton={false}>
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-primary">{t('auth.verifyYourEmail')}</h1>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            {t('auth.emailSentTo', { email })}
          </p>
        </div>

        <Button
          type="button"
          onClick={handleGoBackToSignUp}
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          onTouchCancel={handleLongPressEnd}
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {t('auth.goBackToSignUp')}
        </Button>

        <div className="text-base font-medium text-center leading-relaxed">
          <span className="text-muted-foreground">
            {t('auth.didntReceiveEmail')}{" "}
          </span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendTimer > 0 || isResending}
            className={`font-medium underline ${
              resendTimer > 0 || isResending
                ? "text-muted-foreground cursor-not-allowed"
                : "text-secondary"
            }`}
          >
            {isResending
              ? t('auth.sending')
              : resendTimer > 0
                ? t('auth.resendInSeconds', { count: resendTimer })
                : t('auth.resend')}
          </button>
        </div>
      </div>
    </SignupLayout>
  );
}
