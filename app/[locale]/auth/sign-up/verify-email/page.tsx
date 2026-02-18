"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLocalePath } from "@/lib/use-locale";
import { v2SignupRequest } from "@/@hey_api/users.swagger";
import { cookieName } from "@/app/i18n/settings";
import { locales } from "@/app/i18n/settings";

function getPreferredLocaleFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      "(^| )" + cookieName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]+)",
    ),
  );
  const value = match ? match[2].trim() : null;
  return value && locales.includes(value as (typeof locales)[number])
    ? value
    : null;
}

/**
 * Backend redirects users here: /{locale}/auth/sign-up/verify-email?token=xyz
 * We optionally switch to the user's preferred locale (from cookie), then extract the token,
 * store it in signupRequest, and redirect to /auth/signup/email/verify?token=... so the
 * verify page receives the token in the URL.
 */
function VerifyEmailRedirectContent() {
  const router = useRouter();
  const path = useLocalePath();
  const searchParams = useSearchParams();
  const params = useParams();
  const currentLocale = (params?.locale as string) || "en";
  const { signupRequest, setSignupRequest } = useAuth();
  const didRedirect = useRef(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (didRedirect.current) return;
    didRedirect.current = true;

    const tokenValue = token?.trim() || undefined;

    // If the link is always /fr but user has a preferred locale in cookie, switch once
    const preferredLocale = getPreferredLocaleFromCookie();
    if (preferredLocale && preferredLocale !== currentLocale && tokenValue) {
      router.replace(
        `/${preferredLocale}/auth/sign-up/verify-email?token=${encodeURIComponent(tokenValue)}`,
      );
      return;
    }

    // Only store the token; email/phone are set on signup/email/verify from the API response
    const updated: v2SignupRequest = {
      authFactor: {
        type: "FACTOR_TYPE_EMAIL_VERIFICATION",
        id: "",
        secretValue: tokenValue,
      },
    };
    setSignupRequest(updated);

    // Pass token in URL so the verify page reliably receives it (avoids race with context)
    const verifyPath = tokenValue
      ? `${path("/auth/signup/email/verify")}?token=${encodeURIComponent(tokenValue)}`
      : path("/auth/signup/email/verify");

    router.replace(verifyPath);
  }, [token, setSignupRequest, router, path, currentLocale]);

  return null;
}

export default function VerifyEmailLandingPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailRedirectContent />
    </Suspense>
  );
}
