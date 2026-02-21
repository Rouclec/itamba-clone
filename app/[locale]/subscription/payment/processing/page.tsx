"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { paymentsServiceGetPaymentByIdOptions } from "@/@hey_api/payments.swagger/@tanstack/react-query.gen";
import { fetchUserById } from "@/hooks/use-user";
import { DEFAULT_USER_ROLE } from "@/utils/auth/role";
import type { v2User, v2UserRole, v2AdminRole } from "@/@hey_api/users.swagger";
import { cn } from "@/lib/utils";

const MAX_WAIT_MS = 125_000;
const POLL_INTERVAL_MS = 3000;
const PROGRESS_INTERVAL_MS = 500;

function applyFetchedUser(
  user: v2User | null,
  setCurrentUser: (u: v2User | null) => void,
  setUser: (u: { role: v2UserRole | v2AdminRole; identifier: string } | null) => void,
) {
  if (!user) return;
  setCurrentUser(user);
  const role = (user.userRole ?? DEFAULT_USER_ROLE) as v2UserRole | v2AdminRole;
  const identifier = user.email ?? user.userId ?? user.telephone ?? "";
  setUser({ role, identifier });
}

export default function ProcessingPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const path = useLocalePath();
  const { t } = useT("translation");
  const { userId, setCurrentUser, setUser, hydrated } = useAuth();

  const clientReference =
    searchParams.get("client_reference") ?? searchParams.get("payment_id");
  const tier = searchParams.get("tier") ?? "";

  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(t("payment.processingTitle"));
  const startTimeRef = useRef<number | null>(null);
  const hasNavigatedRef = useRef(false);

  const queryEnabled = !!clientReference && !!userId;

  const { data, isError } = useQuery({
    ...paymentsServiceGetPaymentByIdOptions({
      path: {
        paymentId: clientReference ?? "",
        userId: userId ?? "",
      },
    }),
    enabled: queryEnabled,
    refetchInterval: queryEnabled ? POLL_INTERVAL_MS : false,
    retry: false,
  });

  useEffect(() => {
    if (!clientReference) {
      router.push(
        path(
          `/subscription/payment/error?message=${encodeURIComponent(t("payment.verifyingNoReference"))}`,
        ),
      );
    }
  }, [clientReference, router, path, t]);

  useEffect(() => {
    if (!hydrated || !clientReference) return;
    if (!userId) {
      router.replace(path("/auth/signup"));
    }
  }, [hydrated, userId, clientReference, router, path]);

  useEffect(() => {
    if (!queryEnabled || startTimeRef.current) return;
    startTimeRef.current = Date.now();
  }, [queryEnabled]);

  useEffect(() => {
    if (!startTimeRef.current || hasNavigatedRef.current) return;

    const interval = setInterval(() => {
      if (!startTimeRef.current) return;
      if (hasNavigatedRef.current) {
        clearInterval(interval);
        return;
      }
      const elapsed = Date.now() - startTimeRef.current;
      const percentage = Math.min((elapsed / MAX_WAIT_MS) * 90, 90);
      setProgress(percentage);
      if (elapsed >= MAX_WAIT_MS) {
        hasNavigatedRef.current = true;
        setProgress(100);
        setMessage(t("payment.verifyingPendingLater"));
        clearInterval(interval);
        setTimeout(() => {
          router.push(path("/subscription/payment/error?message=pending"));
        }, 1000);
      }
    }, PROGRESS_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [router, path, t]);

  useEffect(() => {
    const status = data?.payment?.status;
    if (!status || hasNavigatedRef.current) return;

    if (status === "PAYMENT_STATUS_PENDING") return;

    hasNavigatedRef.current = true;

    if (status === "PAYMENT_STATUS_COMPLETED") {
      setMessage(t("payment.verifyingConfirmed"));
      setProgress(95);

      (async () => {
        if (!userId) return;
        try {
          const user = await fetchUserById(userId);
          applyFetchedUser(user, setCurrentUser, setUser);
        } catch {
          // ignore
        }
        setProgress(100);
        setTimeout(() => {
          router.push(path(`/subscription/payment/success?tier=${encodeURIComponent(tier)}`));
        }, 1000);
      })();
      return;
    }

    if (status === "PAYMENT_STATUS_FAILED") {
      setProgress(100);
      setMessage(t("payment.verifyingFailed"));
      setTimeout(() => {
        router.push(path("/subscription/payment/error?message=failed"));
      }, 1000);
      return;
    }

    if (status === "PAYMENT_STATUS_CANCELLED") {
      setProgress(100);
      setMessage(t("payment.verifyingCanceled"));
      setTimeout(() => {
        router.push(path("/subscription/payment/error?message=cancelled"));
      }, 1000);
    }
  }, [
    data?.payment?.status,
    userId,
    setCurrentUser,
    setUser,
    router,
    path,
    tier,
    t,
  ]);

  useEffect(() => {
    if (!isError || hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    setProgress(100);
    setMessage(t("payment.verifyingError"));
    setTimeout(() => {
      router.push(path("/subscription/payment/error?message=error"));
    }, 1000);
  }, [isError, router, path, t]);

  if (!clientReference || (hydrated && !userId)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-8">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-md text-center">
        <h1 className="text-primary text-xl font-semibold">{message}</h1>
        <p className="text-muted-foreground mt-4 text-sm">
          {t("payment.processingSubtitle")}
        </p>
        <Progress
          className={cn("mt-4 h-3 w-full rounded-full")}
          value={progress}
        />
      </div>
    </div>
  );
}
