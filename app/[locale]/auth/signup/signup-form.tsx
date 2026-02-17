"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignupLayout } from "@/components/auth/signup-layout";
import { PhoneInput } from "@/components/auth/phone-input";
import { LocaleLink } from "@/components/locale-link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSignupContext } from "@/lib/signup-context";
import { useAuth } from "@/lib/auth-context";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { toast } from "sonner";
import type { Country } from "@/lib/countries";
import { toFullNumber, isValidPhone, normalizePhone } from "@/utils/phone";
import { useMutation } from "@tanstack/react-query";
import { userServiceSendSignupOtpMutation } from "@/@hey_api/users.swagger/@tanstack/react-query.gen";
import { v2SignupRequest } from "@/@hey_api/users.swagger";

export function SignupForm() {
  const router = useRouter();
  const path = useLocalePath();
  const { t } = useT("translation");
  const { updateFormData } = useSignupContext();
  const { setSignupRequest } = useAuth();

  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("+237");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (value: string): boolean => {
    const full = toFullNumber(dialCode, value);
    if (!full || !isValidPhone(full)) {
      setPhoneError(t("auth.validPhone"));
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (phoneError && value) {
      const full = toFullNumber(dialCode, value);
      if (full && isValidPhone(full)) setPhoneError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullPhone = normalizePhone(dialCode, phone);
    if (!fullPhone) {
      setPhoneError(t("auth.validPhone"));
      return;
    }
    setPhoneError(null);

    setIsLoading(true);
    try {
      await sendSignupOtp({
        body: {
          phoneNumber: fullPhone,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = () => {
    updateFormData({ verificationMethod: "email" });
    router.push(path("/auth/signup/email"));
  };

  const isFormValid =
    phone.replace(/\D/g, "").length >= 6 &&
    !phoneError &&
    isValidPhone(toFullNumber(dialCode, phone));

  const { mutateAsync: sendSignupOtp } = useMutation({
    ...userServiceSendSignupOtpMutation(),
    onSuccess: (data) => {
      if (!data?.requestId) return;
      const e164 = normalizePhone(dialCode, phone);
      const req: v2SignupRequest = {
        authFactor: {
          type: "FACTOR_TYPE_SMS_OTP",
          id: data.requestId,
        },
        phoneNumber: e164 ?? toFullNumber(dialCode, phone),
      };
      setSignupRequest(req);
      updateFormData({
        phone: e164 ?? toFullNumber(dialCode, phone),
        userId: "temp_user",
        verificationMethod: "phone",
      });
      toast.success(t("auth.otpSentSuccess"));
      router.push(path("/auth/signup/phone/otp"));
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? t("auth.errorOccurred"));
    },
  });

  return (
    <SignupLayout showProgress={true} showBackButton={true}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-primary text-center">
            {t("auth.signUpToItamba")}
          </h1>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            {t("auth.signUpSubtitle")}
          </p>
        </div>

        <PhoneInput
          value={phone}
          onChange={handlePhoneChange}
          onCountryChange={(c: Country) => setDialCode(c.dial_code)}
          onBlur={() => {
            if (phone) validatePhone(phone);
          }}
          error={phoneError || undefined}
          required
        />

        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className={`w-full h-11 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
            !isFormValid || isLoading
              ? "bg-slate-500 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 active:bg-primary/80"
          }`}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t("auth.sending")}</span>
            </>
          ) : (
            t("auth.verifyPhoneNumber")
          )}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-background text-muted-foreground">
              {t("common.or")}
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={handleEmailSignup}
          className="w-full h-11"
        >
          <Image
            src="/assets/mail.png"
            alt=""
            width={20}
            height={20}
            className="shrink-0"
          />
          {t("auth.continueWithEmail")}
        </Button>

        <div className="flex flex-col gap-4">
          <p className="text-base font-medium text-center leading-relaxed">
            {t("auth.byProceeding")}{" "}
            <LocaleLink
              href="#"
              className="text-secondary hover:underline font-medium"
            >
              {t("common.terms")}
            </LocaleLink>{" "}
            and{" "}
            <LocaleLink
              href="#"
              className="text-secondary hover:underline font-medium"
            >
              {t("common.privacyPolicy")}
            </LocaleLink>
          </p>

          <p className="text-base font-medium text-center">
            {t("auth.alreadyHaveAccount")}{" "}
            <LocaleLink
              href="/auth/signin"
              className="text-secondary hover:underline font-medium"
            >
              {t("auth.signIn")}
            </LocaleLink>
          </p>
        </div>
      </form>
    </SignupLayout>
  );
}
