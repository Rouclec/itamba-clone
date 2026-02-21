"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { useAuth } from "@/lib/auth-context";
import { paymentsServiceGetPaymentById } from "@/@hey_api/payments.swagger";
import { fetchUserById } from "@/hooks/use-user";
import { DEFAULT_USER_ROLE } from "@/utils/auth/role";
import type { v2User, v2UserRole, v2AdminRole } from "@/@hey_api/users.swagger";
import Image from "next/image";
import { Loader2 } from "lucide-react";

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

function PaymentErrorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const path = useLocalePath();
  const { t } = useT("translation");
  const { userId, setCurrentUser, setUser } = useAuth();

  const clientReference =
    searchParams.get("client_reference") ?? searchParams.get("payment_id");
  const tier = searchParams.get("tier") ?? "";

  const [retrying, setRetrying] = useState(false);

  const errorDetail = searchParams.get("message");
  let decodedMessage: string | null = null;
  if (errorDetail != null) {
    try {
      decodedMessage = decodeURIComponent(errorDetail);
    } catch {
      decodedMessage = errorDetail;
    }
  }

  const handleRetry = async () => {
    if (clientReference && userId) {
      setRetrying(true);
      try {
        const { data } = await paymentsServiceGetPaymentById({
          path: { paymentId: clientReference, userId },
          throwOnError: false,
        });
        const status = data?.payment?.status;

        if (status === "PAYMENT_STATUS_PENDING") {
          const params = new URLSearchParams({ client_reference: clientReference });
          if (tier) params.set("tier", tier);
          router.push(path(`/subscription/payment/processing?${params.toString()}`));
          return;
        }
        if (status === "PAYMENT_STATUS_FAILED" || status === "PAYMENT_STATUS_CANCELLED") {
          router.push(path("/subscription"));
          return;
        }
        if (status === "PAYMENT_STATUS_COMPLETED") {
          const user = await fetchUserById(userId);
          applyFetchedUser(user, setCurrentUser, setUser);
          router.push(path(`/subscription/payment/success?tier=${encodeURIComponent(tier)}`));
          return;
        }
        // Unknown or unspecified status: go to plans to try again
        router.push(path("/subscription"));
      } catch {
        // Fall back to going back or to plans
        router.push(path("/subscription"));
      } finally {
        setRetrying(false);
      }
    } else {
      router.back();
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-8">
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/assets/payment-failed.png"
          alt="Success"
          width={100}
          height={100}
        />
        <div className="text-center">
          <h1 className="text-destructive text-xl font-bold">
            {t("payment.failedTitle")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("payment.failedMessage")}
          </p>
          {decodedMessage && (
            <p className="text-muted-foreground mt-2 text-sm italic">
              {decodedMessage}
            </p>
          )}
        </div>
        <Button
          className="w-full max-w-xs py-3"
          onClick={handleRetry}
          disabled={retrying}
        >
          {retrying ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("common.loading")}
            </>
          ) : (
            t("payment.retry")
          )}
        </Button>
      </div>
    </div>
  );
}

function PaymentErrorPageFallback() {
  const { t } = useT("translation");
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-8">
      <p className="text-muted-foreground">{t("common.loading")}</p>
    </div>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={<PaymentErrorPageFallback />}>
      <PaymentErrorPageContent />
    </Suspense>
  );
}
