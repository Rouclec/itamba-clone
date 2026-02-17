"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignupLayout } from "@/components/auth/signup-layout";
import { OTPInputImproved } from "@/components/auth/otp-input-improved";
import { Button } from "@/components/ui/button";
import { useSignupContext } from "@/lib/signup-context";
import { otpSchema } from "@/lib/form-validators";
import { mockVerifyOTP } from "@/lib/mock-api";
import { toast } from "sonner";
import { z } from "zod";

export default function OTPVerifyPage() {
  const router = useRouter();
  const { formData, updateFormData } = useSignupContext();

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
            router.push("/auth/signup/password");
          }, 500);
        } else {
          setOtpError(result.message);
          toast.error(result.message);
          setOtp("");
        }
      } catch (error) {
        setOtpError("An error occurred. Please try again.");
        toast.error("An error occurred. Please try again.");
        setOtp("");
      } finally {
        setIsLoading(false);
      }
    },
    [formData, updateFormData, router],
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

      toast.success("OTP resent successfully");
    } catch (error) {
      toast.error("Failed to resend OTP");
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
            Verify your phone number
          </h2>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            Enter the 6 digit code sent to{" "}
            {mounted ? formData.phone || "your phone" : "your phone"}
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
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Didn't receive code? </span>
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
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend in 10s"}
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
              Verifying...
            </span>
          ) : (
            "Verify phone number"
          )}
        </Button>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            Having issues getting the code?{" "}
            <a href="#" className="text-secondary hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </form>
    </SignupLayout>
  );
}
