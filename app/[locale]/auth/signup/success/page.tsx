"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignupLayout } from "@/components/auth/signup-layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import Image from "next/image";
import { isAdminRole, DEFAULT_USER_ROLE } from "@/utils/auth/role";
import type { v2UserRole, v2AdminRole } from "@/@hey_api/users.swagger";

export default function SuccessPage() {
  const router = useRouter();
  const path = useLocalePath();
  const { t } = useT("translation");
  const { setSignupRequest, setUser, currentUser } = useAuth();

  // After signup we have the user stored; clear signup request so complete-profile uses only currentUser
  useEffect(() => {
    if (currentUser) setSignupRequest(null);
  }, [currentUser, setSignupRequest]);

  const handleStartBrowsing = () => {
    const role = (currentUser?.userRole ?? DEFAULT_USER_ROLE) as
      | v2UserRole
      | v2AdminRole;
    const identifier =
      currentUser?.email ?? currentUser?.userId ?? "";
    setUser({ role, identifier });
    const redirectPath = isAdminRole(role) ? "/admin" : "/client";
    router.push(path(redirectPath));
  };

  const handleCompleteProfile = () => {
    router.push(path("/profile/complete"));
  };

  return (
    <SignupLayout showProgress={false} showBackButton={false}>
      <div className="flex flex-col items-center justify-center text-center space-y-8 py-12">
        {/* Success Icon */}
        <Image
          width={80}
          height={80}
          src="/assets/account-created.png"
          alt="account created"
        />

        {/* Success Message */}
        <div>
          <h1 className="text-xl font-semibold text-center text-primary">
            {t('auth.accountCreated')}
          </h1>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            {t('auth.accountCreatedSubtitle')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 w-full pt-4">
          <Button
            onClick={handleCompleteProfile}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {t('auth.completeProfile')}
          </Button>
          <button
            onClick={handleStartBrowsing}
            className="w-full h-10 text-primary underline font-medium"
          >
            {t('auth.startBrowsing')}
          </button>
        </div>
      </div>
    </SignupLayout>
  );
}
