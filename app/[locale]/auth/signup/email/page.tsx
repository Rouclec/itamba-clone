"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { SignupLayout } from "@/components/auth/signup-layout";
import { FormInput } from "@/components/auth/form-input";
import { Button } from "@/components/ui/button";
import { LocaleLink } from "@/components/locale-link";
import { useMemo } from "react";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { createEmailSchema, type EmailFormData } from "@/lib/form-validators";
import { mockSendEmailVerification } from "@/lib/mock-api";
import { toast } from "sonner";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { userServiceSendSignupEmailVerificationLinkMutation } from "@/@hey_api/users.swagger/@tanstack/react-query.gen";
import { v2SignupRequest } from "@/@hey_api/users.swagger";
import { useAuth } from "@/lib/auth-context";

export default function EmailSignupPage() {
  const router = useRouter();
  const path = useLocalePath();
  const { t } = useT("translation");
  const { signupRequest, setSignupRequest } = useAuth();
  const emailSchema = useMemo(() => createEmailSchema(t), [t]);

  const [email, setEmail] = useState(signupRequest?.email || "");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (value: string) => {
    try {
      emailSchema.parse({ email: value });
      setEmailError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailError(error.errors[0].message);
      }
      return false;
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) {
      validateEmail(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      return;
    }

    setIsLoading(true);
    try {
      await sendEmailVerification({
        body: {
          email: email,
        },
      });
    } catch (error) {
      console.error({ error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isFormValid = email && !emailError;

  const { mutateAsync: sendEmailVerification } = useMutation({
    ...userServiceSendSignupEmailVerificationLinkMutation(),
    onSuccess: () => {
      const signupRequest: v2SignupRequest = {
        authFactor: {
          type: "FACTOR_TYPE_EMAIL_VERIFICATION",
          id: email,
        },
        email,
      };
      setSignupRequest(signupRequest);
      toast.success(t("auth.emailVerificationSent"));
      router.push(path(`/auth/signup/email/sent`));
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? t("auth.errorOccurred"));
    },
  });

  return (
    <SignupLayout currentStep={1} totalSteps={4} onBack={handleBack}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-primary text-center">
            {t("auth.signUpToItamba")}
          </h1>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            {t("auth.signUpSubtitle")}
          </p>
        </div>

        {/* Email Input */}
        <FormInput
          label={t("auth.emailAddress")}
          type="email"
          placeholder="mariebliss@gmail.com"
          value={email}
          onChange={handleEmailChange}
          onBlur={() => validateEmail(email)}
          error={emailError || undefined}
          required
        />

        {/* Submit Button */}
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
              <span>{t("auth.verifying")}</span>
            </>
          ) : (
            t("auth.verifyEmail")
          )}
        </button>

        {/* Divider */}
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

        {/* Phone Alternative - secondary button */}
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(path("/auth/signup"))}
          className="w-full h-11"
        >
          <Phone className="w-5 h-5 shrink-0" />
          {t("auth.continueWithPhone")}
        </Button>

        <div className="flex flex-col gap-4">
          {/* Terms */}
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

          {/* Sign in link */}
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
