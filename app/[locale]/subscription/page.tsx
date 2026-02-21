"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import {
  subscriptionsListPlans,
  type v2SubscriptionPlan,
  type v2SubscriptionTierType,
} from "@/@hey_api/subscription.swagger";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatAmount } from "@/utils/amountFormatter";
import { subscriptionsSendOrganizationPlanIntentToAdminMutation } from "@/@hey_api/subscription.swagger/@tanstack/react-query.gen";
import { StatusModal } from "@/components/status_modal_component";

interface UIPlan {
  id: string;
  tier?: v2SubscriptionTierType;
  displayName: { en: string; fr: string };
  monthlyPriceXaf?: string;
  yearlyPriceXaf?: string;
  subtitle?: string;
  benefits: string[];
  recommended?: boolean;
  ctaText: string;
  ctaStyle: "solid" | "outline";
}

const mapPlanToUI = (plan: v2SubscriptionPlan, lang: "en" | "fr"): UIPlan => ({
  id: plan.planId ?? "",
  tier: plan.tier,
  displayName: {
    en: plan.displayName?.en ?? "",
    fr: plan.displayName?.fr ?? "",
  },
  monthlyPriceXaf: plan.pricing?.monthlyPriceXaf,
  yearlyPriceXaf: plan.pricing?.yearlyPriceXaf,
  subtitle: plan.description?.[lang],
  benefits: plan.benefits?.[lang] ?? [],
  recommended: plan.tier === "SUBSCRIPTION_TIER_TYPE_PROFESSIONAL",
  ctaText:
    plan.tier === "SUBSCRIPTION_TIER_TYPE_ORGANIZATION"
      ? "Contact us"
      : plan.tier === "SUBSCRIPTION_TIER_TYPE_STUDENT"
        ? "Get Student"
        : "Get Professional",
  ctaStyle:
    plan.tier === "SUBSCRIPTION_TIER_TYPE_PROFESSIONAL" ? "solid" : "outline",
});

export default function SubscriptionPlansPage() {
  const [isYearly, setIsYearly] = useState(true);
  const router = useRouter();
  const path = useLocalePath();
  const { t, i18n } = useT("translation");
  const lang = (i18n.language ?? "en") as "en" | "fr";
  const [modalOpen, setModalOpen] = useState(false);
  const [statusData, setStatusData] = useState<{
    status: "success" | "error";
    heading: string;
    description: string;
  } | null>(null);

  const { userId, hydrated } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["subscriptionPlans", userId, lang],
    queryFn: async () => {
      if (!userId) return [];
      const res = await subscriptionsListPlans({
        path: { userId },
        query: { isActive: true, isVisible: true },
      });
      return (res.data?.plans ?? []).filter(
        (plan) => plan.tier !== "SUBSCRIPTION_TIER_TYPE_FREE"
      );
    },
    enabled: !!userId,
  });

  const plans: UIPlan[] = (data ?? []).map((p) => mapPlanToUI(p, lang));

  const professionalPlan = plans.find((p) => p.recommended);
  const otherPlans = plans.filter((p) => !p.recommended);
  const sortedPlans: UIPlan[] = professionalPlan
    ? otherPlans.length === 2
      ? [otherPlans[0], professionalPlan, otherPlans[1]]
      : [otherPlans[0], professionalPlan]
    : plans;

  const subscriptionIntendRequest = useMutation({
    ...subscriptionsSendOrganizationPlanIntentToAdminMutation(),
    onSuccess: () => {
      setStatusData({
        status: "success",
        heading: "Request Sent!",
        description:
          "Your request has been sent. An admin will get back to you within 5 business days.",
      });
      setModalOpen(true);
    },
    onError: () => {
      setStatusData({
        status: "error",
        heading: "Request Failed",
        description:
          "We could not deliver your request. Check your connection and try again, or contact support@itamba.net",
      });
      setModalOpen(true);
    },
  });

  useEffect(() => {
    if (!hydrated || userId) return;
    router.replace(path("/auth/signup"));
  }, [hydrated, userId, router, path]);

  const handleCTA = (plan: UIPlan) => {
    if (plan.tier === "SUBSCRIPTION_TIER_TYPE_ORGANIZATION") {
      window.open(
        "https://itamba.net/subscription/",
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }
    router.push(
      path(
        `/subscription/payment?plan=${plan.id}&billing=${isYearly ? "yearly" : "monthly"}`
      )
    );
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 py-8">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }
  if (!userId) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 py-8">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 py-8">
        <p className="text-muted-foreground">{t("subscription.loadingPlans")}</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 py-8">
        <p className="text-destructive">{t("subscription.errorLoadingPlans")}</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-20">
      <section className="mx-auto max-w-6xl">
        <header className="mb-8 text-center">
          <h1 className="text-primary text-[32px] font-semibold">
            {t("subscription.pageTitle")}
          </h1>
        </header>

        <div className="flex flex-col items-center">
          <div className="text-tertiary mb-2 text-center text-xs">
            {t("subscription.saveYearly")}
          </div>
          <div className="inline-flex rounded-lg border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={`cursor-pointer rounded-md px-5 py-2 text-sm font-medium transition ${
                !isYearly
                  ? "bg-white text-primary shadow-sm"
                  : "text-primary bg-transparent"
              }`}
            >
              {t("subscription.payMonthly")}
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={`cursor-pointer rounded-md px-5 py-2 text-sm font-medium transition ${
                isYearly
                  ? "bg-white text-primary shadow-sm"
                  : "text-primary bg-transparent"
              }`}
            >
              {t("subscription.payYearly")}
            </button>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {sortedPlans.map((plan) => {
            const isOrganizationPlan =
              plan.tier === "SUBSCRIPTION_TIER_TYPE_ORGANIZATION";
            const displayPrice = isOrganizationPlan
              ? t("subscription.variablePrice")
              : isYearly
                ? plan.yearlyPriceXaf
                  ? `${formatAmount(plan.yearlyPriceXaf, lang)} XAF`
                  : t("subscription.variablePrice")
                : plan.monthlyPriceXaf
                  ? `${formatAmount(plan.monthlyPriceXaf, lang)} XAF`
                  : t("subscription.variablePrice");

            return (
              <Card
                key={plan.id}
                className={`relative flex h-full flex-col rounded-xl border p-6 shadow-none ${
                  plan.recommended
                    ? "border-primary md:-translate-y-6"
                    : "border-border"
                }`}
              >
                <CardHeader className="p-0">
                  <div className="flex justify-between">
                    <h3 className="text-lg font-semibold">
                      {plan.displayName[lang]}
                    </h3>
                    {plan.recommended && (
                      <Badge className="text-primary bg-[#F0F5FF]">
                        {t("subscription.recommended")}
                      </Badge>
                    )}
                  </div>
                  <div className="py-1">
                    <div className="text-primary font-lato text-2xl font-normal leading-5">
                      {displayPrice}
                      <span className="text-inactive-text font-lato ml-1 text-sm font-normal tracking-normal">
                        {isYearly ? t("subscription.perYear") : t("subscription.perMonth")}
                      </span>
                    </div>
                    {plan.subtitle && (
                      <p className="text-tertiary mt-1 text-sm">
                        {plan.subtitle}
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-1">
                  <ul className="space-y-3">
                    {plan.benefits.map((benefit, i) => (
                      <li key={i} className="text-body-text flex gap-3 text-sm">
                        ✓ <span className="text-body-text">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="b-0 mt-auto flex flex-col gap-2 px-0">
                  {plan.tier === "SUBSCRIPTION_TIER_TYPE_STUDENT" && (
                    <p className="text-muted-foreground text-xs">
                      {t("subscription.requiresStudentVerification")}
                    </p>
                  )}
                  <Button
                    variant={
                      plan.tier === "SUBSCRIPTION_TIER_TYPE_ORGANIZATION"
                        ? "outline"
                        : plan.ctaStyle === "solid"
                          ? "default"
                          : "outline"
                    }
                    className={`b-0 w-full cursor-pointer py-3 ${
                      plan.ctaStyle === "solid"
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    }`}
                    onClick={() => handleCTA(plan)}
                    disabled={subscriptionIntendRequest.isPending}
                  >
                    {plan.ctaText}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {statusData && (
        <StatusModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          status={statusData.status}
          heading={statusData.heading}
          description={statusData.description}
          buttonText={
            statusData.status === "success" ? "Go back to library" : undefined
          }
          onButtonClick={
            statusData.status === "success"
              ? () => router.push(path("/client"))
              : undefined
          }
        />
      )}
    </div>
  );
}
