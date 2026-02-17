"use client";

import { useRouter } from "next/navigation";
import { SignupLayout } from "@/components/auth/signup-layout";
import { Button } from "@/components/ui/button";
import { useSignupContext } from "@/lib/signup-context";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function SuccessPage() {
  const router = useRouter();
  const { resetFormData } = useSignupContext();

  const handleStartBrowsing = () => {
    resetFormData();
    router.push("/browse");
  };

  const handleCompleteProfile = () => {
    resetFormData();
    router.push("/profile/complete");
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
            Account Created
          </h1>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            Awesome! You are set to start browsing our library.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 w-full pt-4">
          <Button
            onClick={handleCompleteProfile}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Complete profile
          </Button>
          <button
            onClick={handleStartBrowsing}
            className="w-full h-10 text-primary underline font-medium"
          >
            Start browsing
          </button>
        </div>
      </div>
    </SignupLayout>
  );
}
