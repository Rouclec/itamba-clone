"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { VerificationLoader } from "@/components/auth/verification-loader";
import { userServiceVerifyEmailOptions } from "@/@hey_api/users.swagger/@tanstack/react-query.gen";
import { v2SignupRequest } from "@/@hey_api/users.swagger";
import {
  getEmailVerifiedCache,
  setEmailVerifiedCache,
} from "@/utils/auth/session";

function getBackendErrorMessage(error: unknown): string | undefined {
  const err = error as { response?: { data?: { message?: string } } };
  return err?.response?.data?.message;
}

/** True if the error suggests the token was already used (e.g. after locale change). */
function isAlreadyVerifiedError(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("already") && (lower.includes("verif") || lower.includes("used"))
  );
}

function proceedToPassword(
  email: string,
  token: string,
  signupRequest: v2SignupRequest | null,
  setSignupRequest: (r: v2SignupRequest) => void,
  router: ReturnType<typeof useRouter>,
  path: ReturnType<typeof useLocalePath>,
) {
  const rebuilt: v2SignupRequest = {
    authFactor: {
      type: "FACTOR_TYPE_EMAIL_VERIFICATION",
      secretValue: token,
      id: email,
    },
    email,
    ...(signupRequest?.phoneNumber && {
      phoneNumber: signupRequest.phoneNumber,
    }),
  };
  setSignupRequest(rebuilt);
  router.push(path("/auth/signup/password"));
}

function EmailVerifyContent() {
  const router = useRouter();
  const path = useLocalePath();
  const { t, ready } = useT("translation");
  const searchParams = useSearchParams();
  const { signupRequest, setSignupRequest } = useAuth();
  const successNavigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successHandledRef = useRef(false);
  const [successFromCache, setSuccessFromCache] = useState(false);

  const tokenFromUrl = searchParams.get("token");
  const tokenFromContext = signupRequest?.authFactor?.secretValue;
  const token = (tokenFromUrl ?? tokenFromContext)?.trim() || null;

  const cachedEmail = token ? getEmailVerifiedCache(token) : null;
  const skipQuery = !!cachedEmail;

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
    enabled: ready && !!token && !skipQuery,
  });

  const hasToken = !!token;
  const backendMessage = getBackendErrorMessage(verifyEmailError);
  const treatErrorAsSuccess =
    isQueryError &&
    isAlreadyVerifiedError(backendMessage) &&
    !!cachedEmail;

  const isVerifying = hasToken && isPending && !successFromCache;
  const isSuccess =
    (!!data?.verified && !!data?.email) ||
    successFromCache ||
    treatErrorAsSuccess;
  const isError =
    !hasToken ||
    ((isQueryError || (!!data && !(data.verified && data.email))) && !treatErrorAsSuccess);
  const errorMessage =
    !hasToken
      ? t("verification.verificationFailedDefault")
      : treatErrorAsSuccess
        ? ""
        : getBackendErrorMessage(verifyEmailError) ??
          (data && !(data.verified && data.email)
            ? t("verification.verificationFailedDefault")
            : t("verification.verificationErrorGeneric"));

  // Success from API: cache and proceed
  useEffect(() => {
    if (!data?.verified || !data?.email || !token) return;
    if (successHandledRef.current) return;
    successHandledRef.current = true;
    setEmailVerifiedCache(token, data.email);
    successNavigateTimeoutRef.current = setTimeout(() => {
      successNavigateTimeoutRef.current = null;
      proceedToPassword(
        data.email!,
        token,
        signupRequest,
        setSignupRequest,
        router,
        path,
      );
    }, 1500);
  }, [data?.verified, data?.email, token, signupRequest, setSignupRequest, router, path]);

  // Success from cache (e.g. after locale change): skip API and proceed
  useEffect(() => {
    if (!cachedEmail || !token || successHandledRef.current) return;
    successHandledRef.current = true;
    setSuccessFromCache(true);
    proceedToPassword(
      cachedEmail,
      token,
      signupRequest,
      setSignupRequest,
      router,
      path,
    );
  }, [cachedEmail, token, signupRequest, setSignupRequest, router, path]);

  // API returned "already verified" and we have cache: proceed
  useEffect(() => {
    if (!treatErrorAsSuccess || !cachedEmail || !token || successHandledRef.current)
      return;
    successHandledRef.current = true;
    proceedToPassword(
      cachedEmail,
      token,
      signupRequest,
      setSignupRequest,
      router,
      path,
    );
  }, [treatErrorAsSuccess, cachedEmail, token, signupRequest, setSignupRequest, router, path]);

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
