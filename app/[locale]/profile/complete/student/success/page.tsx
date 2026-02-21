"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { Check, X } from "lucide-react";
import Image from "next/image";

export default function StudentProfileSuccessPage() {
  const router = useRouter();
  const path = useLocalePath();
  const { t } = useT("translation");

  const handleStartBrowsing = () => {
    router.push(path("/client"));
  };

  const handleClose = () => {
    router.push(path("/client"));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-6">
      <div className="relative w-full max-w-md text-center">
        {/* Success icon: blue square with purple offset, white check */}
        <div className="mx-auto mb-6 flex justify-center">
          <Image
            src="/assets/payment-success.png"
            alt="Success"
            width={100}
            height={100}
          />
        </div>

        <h1 className="text-primary text-xl font-bold">
          {t("studentProfileSuccess.title")}
        </h1>

        <p className="text-foreground mt-3 text-sm leading-relaxed">
          {t("studentProfileSuccess.message1")}
        </p>
        <p className="text-foreground mt-2 text-sm leading-relaxed">
          <span className="text-[#9A33FD] font-medium">
            {t("studentProfileSuccess.message2Highlight")}
          </span>
          {t("studentProfileSuccess.message2Rest")}
        </p>

        <Button
          type="button"
          onClick={handleStartBrowsing}
          className="mt-8 w-fit max-w-xs py-3 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {t("studentProfileSuccess.startBrowsing")}
        </Button>
      </div>
    </div>
  );
}
