"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SignupLayout } from "@/components/auth/signup-layout";
import { OTPInputImproved } from "@/components/auth/otp-input-improved";
import { Button } from "@/components/ui/button";
import { useSignupContext } from "@/lib/signup-context";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { createOtpSchema } from "@/lib/form-validators";
import { mockVerifyOTP } from "@/lib/mock-api";
import { toast } from "sonner";
import { z } from "zod";

export default function OTPVerifyPage() {
  const router = useRouter();
  const path = useLocalePath();
  const { t } = useT('translation');
  const { formData, updateFormData } = useSignupContext();
  const otpSchema = useMemo(() => createOtpSchema(t), [t]);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

  const handleOTPComplete = useCallback(
    async (value: string) => {
      if (!validateOTP(value)) {
        return;
      }

      setIsLoading(true);
      try {
        const phone = formData.phone || "";
        const result = await mockVerifyOTP(value, phone);

        if (result.success && result.userId) {
          updateFormData({ userId: result.userId });
          toast.success(result.message);

          setTimeout(() => {
            router.push(path("/auth/signup/password"));
          }, 500);
        } else {
          setOtpError(result.message);
          toast.error(result.message);
          setOtp("");
        }
      } catch (error) {
        setOtpError(t('auth.errorOccurred'));
        toast.error(t('auth.errorOccurred'));
        setOtp("");
      } finally {
        setIsLoading(false);
      }
    },
    [formData, updateFormData, router, path, t, otpSchema],
  );

  const handleResendOTP = async () => {
    try {
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

      toast.success(t('auth.otpResentSuccess'));
    } catch (error) {
      toast.error(t('auth.failedToResendOtp'));
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SignupLayout
      currentStep={2}
      totalSteps={4}
      onBack={handleBack}
      backgroundImage="/assets/password-bg.png"
    >
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-primary text-center">
            {t('auth.verifyYourPhone')}
          </h2>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            {t('auth.enterCodeSentTo')}{" "}
            {mounted ? formData.phone || t('auth.yourPhone') : t('auth.yourPhone')}
          </p>
        </div>

        {/* OTP Input */}
        <OTPInputImproved
          length={6}
          value={otp}
          onChange={setOtp}
          onComplete={handleOTPComplete}
          error={!!otpError}
        />

        {/* Resend OTP */}
        <div className="text-base font-medium text-center leading-relaxed">
          <span className="text-body-text">{t('auth.didntReceiveCode')} </span>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resendTimer > 0}
            className={`font-medium hover:underline ${
              resendTimer > 0
                ? "text-muted-foreground cursor-not-allowed"
                : "text-secondary"
            }`}
          >
            {resendTimer > 0 ? t('auth.resendIn', { count: resendTimer }) : t('auth.resendIn10s')}
          </button>
        </div>

        {/* Manual Verify Button (backup) */}
        <Button
          onClick={() => handleOTPComplete(otp)}
          disabled={otp.length !== 6 || isLoading}
          className={`w-full h-11 rounded-lg font-semibold text-white cursor-pointer transition-all flex items-center justify-center gap-2 ${
            otp.length !== 6
              ? "bg-slate-500 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 active:bg-primary/80"
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

        {/* Footer */}
        <div className="text-base font-semibold text-center leading-relaxed">
          <p>
            {t('auth.havingIssues')}{" "}
            <a href="#" className="text-secondary hover:underline">
              {t('common.contactUs')}
            </a>
          </p>
        </div>
      </form>
    </SignupLayout>
  );
}
