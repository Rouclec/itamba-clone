"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { VerificationLoader } from "@/components/auth/verification-loader";
import { userServiceVerifyEmailOptions } from "@/@hey_api/users.swagger/@tanstack/react-query.gen";
import { v2SignupRequest } from "@/@hey_api/users.swagger";

function getBackendErrorMessage(error: unknown): string | undefined {
  const err = error as { response?: { data?: { message?: string } } };
  return err?.response?.data?.message;
}

function EmailVerifyContent() {
  const router = useRouter();
  const path = useLocalePath();
  const { t, ready } = useT("translation");
  const searchParams = useSearchParams();
  const { signupRequest, setSignupRequest } = useAuth();
  const successNavigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successHandledRef = useRef(false);

  const tokenFromUrl = searchParams.get("token");
  const tokenFromContext = signupRequest?.authFactor?.secretValue;
  const token = (tokenFromUrl ?? tokenFromContext)?.trim() || null;

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
    enabled: ready && !!token,
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

    const rebuilt: v2SignupRequest = {
      authFactor: {
        type: "FACTOR_TYPE_EMAIL_VERIFICATION",
        secretValue: token ?? "",
        id: data.email,
      },
      email: data.email,
      ...(signupRequest?.phoneNumber && {
        phoneNumber: signupRequest.phoneNumber,
      }),
    };
    setSignupRequest(rebuilt);
    successNavigateTimeoutRef.current = setTimeout(() => {
      successNavigateTimeoutRef.current = null;
      router.push(path("/auth/signup/password"));
    }, 1500);
  }, [data?.verified, data?.email, signupRequest?.phoneNumber, setSignupRequest, router, path]);

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
    router.push(path(signupRequest?.email ? "/auth/signup/email/sent" : "/auth/signup/email"));
  };

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

function EmailVerifyFallback() {
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

export default function EmailVerifyPage() {
  return (
    <Suspense fallback={<EmailVerifyFallback />}>
      <EmailVerifyContent />
    </Suspense>
  );
}
