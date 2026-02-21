"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { PENDING_SUBSCRIPTION_RETURN_KEY } from "@/utils/auth/session";
import { subscriptionsGetPlan } from "@/@hey_api/subscription.swagger";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatAmount } from "@/utils/amountFormatter";
import { subscriptionsCreateUserSubscriptionMutation } from "@/@hey_api/subscription.swagger/@tanstack/react-query.gen";
import { paymentsServiceInitiatePaymentsMutation } from "@/@hey_api/payments.swagger/@tanstack/react-query.gen";
import type { v2BillingCycle } from "@/@hey_api/subscription.swagger";
import type { v2PaymentMethod } from "@/@hey_api/payments.swagger";
import { PhoneInput } from "@/components/auth/phone-input";
import { FormInput } from "@/components/auth/form-input";
import { toFullNumber, isValidPhone } from "@/utils/phone";
import type { Country } from "@/lib/countries";
import { getAxiosErrorMessage } from "@/utils/axios-error";

const PAYMENT_METHODS = [
  {
    id: "mobile_money",
    labelKey: "payment.mobileMoney",
    image: "/assets/mtn.png",
  },
  {
    id: "orange_money",
    labelKey: "payment.orangeMoney",
    image: "/assets/orange.png",
  },
  { id: "card", labelKey: "payment.cardPayment", image: "/assets/card.png" },
] as const;

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

function PaymentMethodCard({
  method,
  isSelected,
  onSelect,
  t,
}: {
  method: (typeof PAYMENT_METHODS)[number];
  isSelected: boolean;
  onSelect: () => void;
  t: (key: string) => string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-start gap-2 rounded-lg border border-border py-2 px-4 transition ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      }`}
    >
      <div className="relative flex h-16 w-40 items-start justify-start overflow-hidden rounded">
        {!imgFailed ? (
          <Image
            src={method.image}
            alt={t(method.labelKey)}
            width={64}
            height={48}
            onError={() => setImgFailed(true)}
            className="object-contain"
          />
        ) : (
          <span className="text-muted-foreground text-xs font-medium">
            {method.id === "mobile_money"
              ? "MTN"
              : method.id === "orange_money"
                ? "Orange"
                : "Card"}
          </span>
        )}
      </div>
      <span className="text-sm font-medium">{t(method.labelKey)}</span>
    </button>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const path = useLocalePath();
  const { t, i18n } = useT("translation");
  const lang = (i18n.language ?? "en") as "en" | "fr";
  const { userId, hydrated } = useAuth();

  const planId = searchParams.get("plan");
  const billing = searchParams.get("billing") ?? "monthly";
  const isYearly = billing === "yearly";

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodId>("mobile_money");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [dialCode, setDialCode] = useState("+237");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  // If not hydrated yet, wait to avoid flashing redirect
  useEffect(() => {
    if (!hydrated) return;
    if (!userId) {
      const returnPath = `/subscription/payment?plan=${planId ?? ""}&billing=${billing}`;
      try {
        localStorage.setItem(PENDING_SUBSCRIPTION_RETURN_KEY, path(returnPath));
      } catch {
        // ignore
      }
      router.replace(path("/auth/signup"));
      return;
    }
  }, [hydrated, userId, router, path, planId, billing]);

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ["subscriptionPlan", userId, planId],
    queryFn: async () => {
      if (!userId || !planId) return null;
      const res = await subscriptionsGetPlan({
        path: { userId, planId },
      });
      return res.data?.plan ?? null;
    },
    enabled: !!userId && !!planId,
  });

  const { mutateAsync: createSubscription } = useMutation({
    ...subscriptionsCreateUserSubscriptionMutation(),
  });

  const { mutateAsync: initiatePayment, isPending } = useMutation({
    ...paymentsServiceInitiatePaymentsMutation(),
  });

  const handleConfirmPayment = async () => {
    if (!userId || !planId || !plan) return;
    try {
      const subscriptionRes = await createSubscription({
        path: { userId },
        body: {
          planId,
          preferedBillingCycle: isYearly
            ? ("BILLING_CYCLE_YEARLY" as v2BillingCycle)
            : ("BILLING_CYCLE_MONTHLY" as v2BillingCycle),
        },
      });
      const subscriptionId = subscriptionRes?.subscription?.subscriptionId;
      if (!subscriptionId) {
        router.push(
          path(
            `/subscription/payment/error?message=${encodeURIComponent("Failed to create subscription")}`,
          ),
        );
        return;
      }

      const apiPaymentMethod: v2PaymentMethod =
        paymentMethod === "card"
          ? "PAYMENT_METHOD_STRIPE"
          : "PAYMENT_METHOD_PAWAPAY";
      const isCard = paymentMethod === "card";
      const tier = plan?.tier ?? "";
      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${path(`/subscription/payment/processing`)}${tier ? `?tier=${encodeURIComponent(tier)}` : ""}`
          : undefined;

      const response = await initiatePayment({
        path: { userId },
        body: {
          paymentMethod: apiPaymentMethod,
          subscriptionId,
          email: isCard ? email.trim() || undefined : undefined,
          payerPhoneNumber:
            !isCard && toFullNumber(dialCode, phoneDigits)
              ? toFullNumber(dialCode, phoneDigits)
              : undefined,
          callbackUrl: isCard ? callbackUrl : undefined,
        },
      });

      if (isCard && response?.checkoutUrl) {
        window.location.href = response.checkoutUrl;
        return;
      }
      router.push(
        path(
          `/subscription/payment/processing?client_reference=${encodeURIComponent(response?.paymentId ?? "")}&tier=${encodeURIComponent(tier)}`,
        ),
      );
    } catch (err) {
      const message = getAxiosErrorMessage(err);
      const safeMessage =
        message.length > 300 ? message.slice(0, 300) : message;
      router.push(
        path(
          `/subscription/payment/error?message=${encodeURIComponent(safeMessage)}`,
        ),
      );
    }
  };

  if (!hydrated || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!planId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 py-8">
        <div className="text-center">
          <p className="text-destructive">
            Missing plan. Please select a plan first.
          </p>
          <Button
            variant="link"
            onClick={() => router.push(path("/subscription"))}
          >
            {t("common.back")}
          </Button>
        </div>
      </div>
    );
  }

  if (planLoading || !plan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  const displayPrice = isYearly
    ? plan.pricing?.yearlyPriceXaf
      ? `${formatAmount(plan.pricing.yearlyPriceXaf, lang)} XAF`
      : t("subscription.variablePrice")
    : plan.pricing?.monthlyPriceXaf
      ? `${formatAmount(plan.pricing.monthlyPriceXaf, lang)} XAF`
      : t("subscription.variablePrice");
  const planName = plan.displayName?.[lang] ?? plan.displayName?.en ?? "";

  const needsPhone =
    paymentMethod === "mobile_money" || paymentMethod === "orange_money";
  const needsEmail = paymentMethod === "card";

  const isPhoneValid =
    needsPhone && isValidPhone(toFullNumber(dialCode, phoneDigits));
  const isEmailValid =
    needsEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isInputValid = needsPhone
    ? isPhoneValid
    : needsEmail
      ? isEmailValid
      : true;

  const validatePhone = (): boolean => {
    const full = toFullNumber(dialCode, phoneDigits);
    if (!full || !isValidPhone(full)) {
      setPhoneError(t("auth.validPhone"));
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const validateAndConfirm = () => {
    if (needsPhone && !validatePhone()) return;
    if (needsEmail) {
      const trimmed = email.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      if (!trimmed || !valid) {
        setEmailError(t("auth.validEmail"));
        return;
      }
      setEmailError(null);
    }
    handleConfirmPayment();
  };

  return (
    <div className="px-6 py-8 lg:px-20">
      <div className="mx-auto grid w-full max-w-6xl mb-12">
        <h1 className="text-primary text-2xl font-bold">
          {t("payment.completePayment")}
        </h1>
        <p className="text-body-text mt-1 text-base font-normal">
          {t("payment.chooseMethod")}
        </p>
      </div>
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
        <div className="border border-border rounded-xl p-4 lg:h-96 flex flex-col justify-between">
          <div>
            <div className="mt-4 flex flex-wrap gap-4">
              {PAYMENT_METHODS.map((method) => (
                <PaymentMethodCard
                  key={method.id}
                  method={method}
                  isSelected={paymentMethod === method.id}
                  onSelect={() => setPaymentMethod(method.id)}
                  t={t}
                />
              ))}
            </div>

            {needsPhone && (
              <div className="mt-6">
                <PhoneInput
                  value={phoneDigits}
                  onChange={(value) => {
                    setPhoneDigits(value);
                    if (phoneError) setPhoneError(null);
                  }}
                  onCountryChange={(c: Country) => setDialCode(c.dial_code)}
                  onBlur={() => phoneDigits && validatePhone()}
                  error={phoneError ?? undefined}
                  required
                />
              </div>
            )}

            {needsEmail && (
              <div className="mt-6">
                <FormInput
                  label={t("auth.emailAddress")}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  onBlur={() => {
                    const trimmed = email.trim();
                    if (!trimmed) setEmailError(null);
                    else
                      setEmailError(
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
                          ? null
                          : t("auth.validEmail"),
                      );
                  }}
                  error={emailError ?? undefined}
                  placeholder="you@example.com"
                  required
                />
              </div>
            )}
          </div>

          <Button
            className={`mt-8 w-fit py-3 transition-all ${
              isPending || !isInputValid
                ? "bg-slate-500 cursor-not-allowed text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
            onClick={validateAndConfirm}
            disabled={isPending || !isInputValid}
          >
            {isPending ? t("common.loading") : t("payment.confirmPayment")}
          </Button>
        </div>

        <div className="rounded-xl border border-border p-6 max-h-60">
          <h2 className="text-primary font-bold">{t("payment.planSummary")}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-body-text ">{t("payment.planName")}</dt>
              <dd className="text-body-text font-semibold">{planName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-body-text">{t("payment.price")}</dt>
              <dd className="text-body-text font-semibold">{displayPrice}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-body-text">
                {t("payment.renewalPeriod")}
              </dt>
              <dd className="text-body-text font-semibold">
                {isYearly ? t("payment.yearly") : t("payment.monthly")}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
