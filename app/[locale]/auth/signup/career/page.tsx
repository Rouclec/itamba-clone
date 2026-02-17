"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignupLayout } from "@/components/auth/signup-layout";
import { RoleSelector, type Role } from "@/components/auth/role-selector";
import { Button } from "@/components/ui/button";
import { useSignupContext } from "@/lib/signup-context";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { mockSelectRole } from "@/lib/mock-api";
import { toast } from "sonner";

export default function CareerPage() {
  const router = useRouter();
  const path = useLocalePath();
  const { t } = useT('translation');
  const { formData, updateFormData } = useSignupContext();

  const CAREER_ROLES: Role[] = [
    { id: "student", label: t('auth.careerStudent') },
    { id: "employed", label: t('auth.careerEmployed') },
    { id: "self-employed", label: t('auth.careerSelfEmployed') },
    { id: "job-seeker", label: t('auth.careerJobSeeker') },
    { id: "business-man", label: t('auth.careerBusinessMan') },
    { id: "other", label: t('auth.careerOther') },
  ];

  const [selectedRole, setSelectedRole] = useState<string>(formData.role || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      toast.error(t('auth.pleaseSelectCareerRole'));
      return;
    }

    setIsLoading(true);
    try {
      const userId = formData.userId || "temp_user";
      const result = await mockSelectRole(userId, selectedRole);

      if (result.success) {
        updateFormData({ role: selectedRole });
        toast.success(result.message);

        setTimeout(() => {
          router.push(path("/auth/signup/success"));
        }, 500);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(t('auth.errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SignupLayout
      currentStep={4}
      totalSteps={4}
      onBack={handleBack}
      backgroundImage="/assets/profession-bg.png"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-primary text-center">
            {t('auth.whoAreYouSigningUpAs')}
          </h2>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            {t('auth.tellUsYourRole')}
          </p>
        </div>

        {/* Role Selector */}
        <RoleSelector
          roles={CAREER_ROLES}
          value={selectedRole}
          onChange={setSelectedRole}
          disabled={isLoading}
          columns={3}
        />

        {/* Continue Button */}
        <button
          type="submit"
          disabled={!selectedRole || isLoading}
          className={`w-full h-11 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
            !selectedRole || isLoading
              ? "bg-slate-500 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 active:bg-primary/80"
          }`}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('auth.continuing')}</span>
            </>
          ) : (
            t('common.continue')
          )}
        </button>
      </form>
    </SignupLayout>
  );
}
