"use client";

import { useRouter } from "next/navigation";
import { SignupLayout } from "@/components/auth/signup-layout";
import { Button } from "@/components/ui/button";
import { useSignupContext } from "@/lib/signup-context";
import { useAuth } from "@/lib/auth-context";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import Image from "next/image";

export default function SuccessPage() {
  const router = useRouter();
  const path = useLocalePath();
  const { t } = useT('translation');
  const { resetFormData, formData } = useSignupContext();
  const { setUser } = useAuth();

  const handleStartBrowsing = () => {
    const email = (formData.email || "").toLowerCase().trim();
    const identifier = formData.email || formData.phone || "";
    const role = email === "admin@example.com" ? "admin" : "client";
    setUser({ role, identifier });
    resetFormData();
    router.push(path(role === "admin" ? "/admin" : "/client"));
  };

  const handleCompleteProfile = () => {
    resetFormData();
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
