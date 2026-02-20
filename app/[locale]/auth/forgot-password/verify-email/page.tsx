"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForgotPassword } from "@/contexts/forgot-password-context";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { VerificationLoader } from "@/components/auth/verification-loader";
import { userServiceVerifyEmailOptions } from "@/@hey_api/users.swagger/@tanstack/react-query.gen";
import { getPreferredLocaleFromCookie } from "@/app/i18n/get-preferred-locale";

function getBackendErrorMessage(error: unknown): string | undefined {
  const err = error as { response?: { data?: { message?: string } } };
  return err?.response?.data?.message;
}

function ForgotPasswordVerifyEmailContent() {
  const router = useRouter();
  const path = useLocalePath();
  const params = useParams();
  const { t, ready } = useT("translation");
  const searchParams = useSearchParams();
  const { setForgotPassword } = useForgotPassword();
  const successNavigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successHandledRef = useRef(false);
  const localeRedirectDoneRef = useRef(false);
  const [localeChecked, setLocaleChecked] = useState(false);

  const currentLocale = (params?.locale as string) || "en";
  const tokenFromUrl = searchParams.get("token");
  const token = tokenFromUrl?.trim() || null;

  // Email link is always e.g. /fr – switch to user's preferred locale if different
  useEffect(() => {
    if (localeRedirectDoneRef.current || localeChecked) return;
    const preferred = getPreferredLocaleFromCookie();
    if (preferred && preferred !== currentLocale && token) {
      localeRedirectDoneRef.current = true;
      router.replace(
        `/${preferred}/auth/forgot-password/verify-email?token=${encodeURIComponent(token)}`,
      );
      return;
    }
    setLocaleChecked(true);
  }, [currentLocale, token, localeChecked, router]);

  const {
    data,
    isError: isQueryError,
    error: verifyEmailError,
    isPending,
    refetch,
  } = useQuery({
    ...userServiceVerifyEmailOptions({
      path: {
        token: token ?? "",
      },
    }),
    enabled: localeChecked && ready && !!token,
  });

  const hasToken = !!token;
  const isVerifying = hasToken && isPending;
  const isError = !hasToken || isQueryError || (!!data && !(data.verified && data.email));
  const errorMessage =
    !hasToken
      ? t("verification.verificationFailedDefault")
      : getBackendErrorMessage(verifyEmailError) ??
        (data && !(data.verified && data.email)
          ? t("verification.verificationFailedDefault")
          : t("verification.verificationErrorGeneric"));

  useEffect(() => {
    if (!data?.verified || !data?.email) return;
    if (successHandledRef.current) return;
    successHandledRef.current = true;

    // Build context from scratch: user may be on a different browser (no prior forgot-password state).
    // We only have token from URL; email comes from the verify API response.
    setForgotPassword({
      mode: "email",
      email: data.email,
      emailVerificationToken: token ?? null,
      requestId: null,
      phoneNumber: null,
    });
    successNavigateTimeoutRef.current = setTimeout(() => {
      successNavigateTimeoutRef.current = null;
      router.push(path("/auth/forgot-password/new-password"));
    }, 1500);
  }, [data?.verified, data?.email, setForgotPassword, router, path]);

  useEffect(() => {
    return () => {
      if (successNavigateTimeoutRef.current) {
        clearTimeout(successNavigateTimeoutRef.current);
        successNavigateTimeoutRef.current = null;
      }
    };
  }, []);

  const handleRetry = () => {
    if (token) refetch();
  };

  const handleBack = () => {
    router.push(path("/auth/forgot-password/email-sent"));
  };

  if (!localeChecked) {
    return null;
  }

  return (
    <VerificationLoader
      isLoading={isVerifying && !isQueryError}
      isError={isError}
      errorMessage={errorMessage}
      successMessage={t("verification.emailVerifiedSuccess")}
      message={t("verification.verifyingEmail")}
      onRetry={handleRetry}
      onBack={handleBack}
    />
  );
}

function ForgotPasswordVerifyEmailFallback() {
  const { t } = useT("translation");
  return (
    <VerificationLoader
      isLoading
      isError={false}
      errorMessage=""
      successMessage=""
      message={t("common.loading")}
      onRetry={() => {}}
      onBack={() => {}}
    />
  );
}

export default function ForgotPasswordVerifyEmailPage() {
  return (
    <Suspense fallback={<ForgotPasswordVerifyEmailFallback />}>
      <ForgotPasswordVerifyEmailContent />
    </Suspense>
  );
}
