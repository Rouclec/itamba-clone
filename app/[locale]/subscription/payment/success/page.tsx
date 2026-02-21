"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { fetchUserById } from "@/hooks/use-user";
import { DEFAULT_USER_ROLE } from "@/utils/auth/role";
import type { v2User, v2UserRole, v2AdminRole } from "@/@hey_api/users.swagger";
import Image from "next/image";

const STUDENT_TIER = "SUBSCRIPTION_TIER_TYPE_STUDENT";

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

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const path = useLocalePath();
  const { t } = useT("translation");
  const { userId, setCurrentUser, setUser } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);

  const tier = searchParams.get("tier") ?? "";
  const isStudent = tier === STUDENT_TIER;

  useEffect(() => {
    if (!userId) return;
    fetchUserById(userId).then((user) => {
      applyFetchedUser(user, setCurrentUser, setUser);
    });
  }, [userId, setCurrentUser, setUser]);

  const handlePrimaryAction = async () => {
    if (!userId) return;
    setIsNavigating(true);
    try {
      const user = await fetchUserById(userId);
      applyFetchedUser(user, setCurrentUser, setUser);
      if (isStudent) {
        router.push(path("/profile/complete"));
      } else {
        router.push(path("/client"));
      }
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-8">
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/assets/payment-success.png"
          alt="Success"
          width={100}
          height={100}
        />
        <div className="text-center">
          <h1 className="text-primary text-xl font-bold">
            {t("payment.successTitle")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("payment.successMessage")}
          </p>
        </div>
        <Button
          className="w-full max-w-xs py-3"
          onClick={handlePrimaryAction}
          disabled={isNavigating}
        >
          {isNavigating
            ? t("common.loading")
            : isStudent
              ? t("payment.completeStudentProfile")
              : t("payment.returnToDashboard")}
        </Button>
      </div>
    </div>
  );
}
