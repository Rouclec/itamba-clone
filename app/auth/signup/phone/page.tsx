"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SignupLayout } from "@/components/auth/signup-layout";
import { PhoneInput } from "@/components/auth/phone-input";
import { Button } from "@/components/ui/button";
import { useSignupContext } from "@/lib/signup-context";
import { mockSendOTP } from "@/lib/mock-api";
import { toast } from "sonner";
import type { Country } from "@/lib/countries";
import Link from "next/link";

function parseStoredPhone(phone: string | undefined): {
  dialCode: string;
  national: string;
} {
  if (!phone) return { dialCode: "+237", national: "" };
  const match = phone.match(/^(\+\d+)(.*)$/);
  if (match)
    return { dialCode: match[1], national: match[2].replace(/\D/g, "") };
  return { dialCode: "+237", national: phone.replace(/\D/g, "") };
}

export default function PhoneSignupPage() {
  const router = useRouter();
  const { formData, updateFormData } = useSignupContext();
  const { dialCode: initialDialCode, national: initialNational } =
    parseStoredPhone(formData.phone);

  const [phone, setPhone] = useState(initialNational);
  const [dialCode, setDialCode] = useState(initialDialCode);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (value: string): boolean => {
    const digits = value.replace(/\D/g, "");
    if (!digits || digits.length < 6) {
      setPhoneError("Please enter a valid phone number");
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (phoneError && value && value.replace(/\D/g, "").length >= 6) {
      setPhoneError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhone(phone)) {
      return;
    }

    setIsLoading(true);
    const digits = phone.replace(/\D/g, "");
    const fullPhone = dialCode + digits;
    try {
      const result = await mockSendOTP(fullPhone);

      if (result.success) {
        updateFormData({ phone: fullPhone, userId: "temp_user" });
        toast.success("OTP sent successfully");

        setTimeout(() => {
          router.push("/auth/signup/phone/otp");
        }, 500);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isFormValid = phone.replace(/\D/g, "").length >= 6 && !phoneError;

  return (
    <SignupLayout currentStep={1} totalSteps={4} onBack={handleBack}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-primary text-center">
            Sign up to Itamba
          </h1>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            Sign Up to enjoy well organized and up to date Cameroon law
          </p>
        </div>

        {/* Phone Input */}
        <PhoneInput
          value={phone}
          onChange={handlePhoneChange}
          onCountryChange={(c: Country) => setDialCode(c.dial_code)}
          onBlur={() => {
            if (phone) validatePhone(phone);
          }}
          error={phoneError || undefined}
          required
          defaultCountryCode={
            formData.phone
              ? parseStoredPhone(formData.phone).dialCode
              : undefined
          }
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className={`w-full h-11 rounded-lg font-semibold text-white cursor-pointer transition-all flex items-center justify-center gap-2 ${
            !isFormValid || isLoading
              ? "bg-slate-500 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 active:bg-primary/80"
          }`}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            "Verify phone number"
          )}
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-background text-muted-foreground">or</span>
          </div>
        </div>

        {/* Email Alternative - secondary button */}
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            updateFormData({ verificationMethod: "email" });
            router.push("/auth/signup/email");
          }}
          className="w-full h-11"
        >
          <Image
            src="/assets/mail.png"
            alt=""
            width={20}
            height={20}
            className="shrink-0"
          />
          Continue with Email
        </Button>

        <div className="flex flex-col gap-4">
          {/* Terms */}
          <p className="text-base font-medium text-center leading-relaxed">
            By proceeding, you agree to our{" "}
            <Link
              href="#"
              className="text-secondary hover:underline font-medium"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="text-secondary hover:underline font-medium"
            >
              Privacy Policy
            </Link>
          </p>

          {/* Sign in link */}
          <p className="text-base font-medium text-center">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="text-secondary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </SignupLayout>
  );
}
