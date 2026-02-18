"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignupLayout } from "@/components/auth/signup-layout";
import { RoleSelector, type Role } from "@/components/auth/role-selector";
import { Button } from "@/components/ui/button";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useMutation } from "@tanstack/react-query";
import { userServiceSignupMutation } from "@/@hey_api/users.swagger/@tanstack/react-query.gen";
import { setAuthorizationHeaders } from "@/utils/inteceptor";
import { setRefreshTokenInStorage } from "@/utils/auth/session";
import { useGetUserById } from "@/hooks/use-user";

export default function CareerPage() {
  const router = useRouter();
  const path = useLocalePath();
  const { t } = useT("translation");
  const { signupRequest, setUserId, userId, setCurrentUser } = useAuth();

  // TODO: convert this to v2 implementation when endpoint is ready
  const { data: userData, isSuccess } = useGetUserById(userId);

  useEffect(() => {
    if (isSuccess && userData) {
      setCurrentUser(userData);

      toast.success(t("auth.accountCreated"));
      router.push(path("/auth/signup/success"));
    }
  }, [isSuccess, userData, setCurrentUser]);

  const CAREER_ROLES: Role[] = [
    { id: "student", label: t("auth.careerStudent") },
    { id: "lawyer", label: t("auth.careerLawyer") },
    { id: "self-employed", label: t("auth.careerSelfEmployed") },
    { id: "job-seeker", label: t("auth.careerJobSeeker") },
    { id: "business-man", label: t("auth.careerBusinessMan") },
    { id: "other", label: t("auth.careerOther") },
  ];

  const [selectedRole, setSelectedRole] = useState<string>(
    signupRequest?.profession || "",
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      toast.error(t("auth.pleaseSelectCareerRole"));
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        body: {
          ...signupRequest,
          profession: selectedRole,
        },
      });
    } catch (error) {
      console.error({ error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const { mutateAsync: signup } = useMutation({
    ...userServiceSignupMutation(),
    onSuccess: (data) => {
      const accessToken = data?.tokens?.accessToken ?? "";
      if (accessToken) setAuthorizationHeaders(accessToken);
      if (data?.tokens?.refreshToken)
        setRefreshTokenInStorage(data.tokens.refreshToken);
      if (data?.userId) setUserId(data.userId);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? t("auth.errorOccurred"));
    },
  });

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
            {t("auth.whoAreYouSigningUpAs")}
          </h2>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            {t("auth.tellUsYourRole")}
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
              <span>{t("auth.continuing")}</span>
            </>
          ) : (
            t("common.continue")
          )}
        </button>
      </form>
    </SignupLayout>
  );
}
