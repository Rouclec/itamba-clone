"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignupLayout } from "@/components/auth/signup-layout";
import { FormInput } from "@/components/auth/form-input";
import { PhoneInput } from "@/components/auth/phone-input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useLocalePath } from "@/lib/use-locale";
import { isAdminRole, DEFAULT_USER_ROLE } from "@/utils/auth/role";
import { useT } from "@/app/i18n/client";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { userServiceCompleteProfileMutation } from "@/@hey_api/users.swagger/@tanstack/react-query.gen";
import { toast } from "sonner";
import { fetchUserById } from "@/hooks/use-user";
import type { v2UserRole, v2AdminRole } from "@/@hey_api/users.swagger";

function parseStoredPhone(phone: string | undefined): {
  dialCode: string;
  national: string;
} {
  if (!phone) return { dialCode: "+237", national: "" };
  const match = phone.match(/^(\+\d+)(.*)$/);
  if (match)
    return { dialCode: match[1], national: match[2].replace(/\D/g, "") };
  return { dialCode: "+237", national: phone.replace(/\D/g, "") };
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const path = useLocalePath();
  const { t } = useT("translation");
  const { setUser, userId, setCurrentUser, currentUser } = useAuth();
  const isPhoneSignup = !!(
    currentUser?.telephone && !currentUser?.email
  );

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(currentUser?.fullName ?? "");
  const [phone, setPhone] = useState(() => {
    const { national } = parseStoredPhone(currentUser?.telephone);
    return national;
  });
  const [dialCode, setDialCode] = useState(
    () => parseStoredPhone(currentUser?.telephone).dialCode,
  );
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [location, setLocation] = useState(
    currentUser?.city ?? currentUser?.address ?? "",
  );
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isLastStep = isPhoneSignup ? step === 3 : step === 2;
  const showLocation =
    (!isPhoneSignup && step >= 2) || (isPhoneSignup && step >= 3);

  const handleContinue = () => {
    if (step === 0) {
      const trimmed = fullName.trim();
      if (!trimmed) {
        setFullNameError(t("profile.pleaseEnterFullName"));
        return;
      }
      setFullNameError(null);
      setStep(1);
      return;
    }
    if (step === 1) {
      if (isPhoneSignup) {
        setStep(2);
        return;
      }
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 6) return;
      setStep(2);
      return;
    }
    if (step === 2 && isPhoneSignup) {
      if (!email.trim()) {
        setEmailError(t("profile.pleaseEnterEmail"));
        return;
      }
      setEmailError(null);
      setStep(3);
      return;
    }
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error(t("common.errorOccured"));
      return;
    }
    setSaving(true);
    try {
      const builtPhone = (dialCode + phone.replace(/\D/g, "")).trim();
      const finalPhone =
        builtPhone || currentUser?.telephone || undefined;
      await completeProfile({
        path: { userId },
        body: {
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          phoneNumber: finalPhone || undefined,
          location: location.trim() || undefined,
        },
      });
      const freshUser = await fetchUserById(userId);
      if (freshUser) {
        setCurrentUser(freshUser);
        const role = (freshUser.userRole ?? DEFAULT_USER_ROLE) as
          | v2UserRole
          | v2AdminRole;
        const identifier =
          freshUser.userId ?? freshUser.email ?? freshUser?.telephone ?? "";
        setUser({ role, identifier });
        router.push(path(isAdminRole(role) ? "/admin" : "/client"));
      } else {
        toast.error(t("common.errorOccured"));
      }
    } catch {
      // onError shows toast
    } finally {
      setSaving(false);
    }
  };

  const handleDoItLater = () => {
    const role = (currentUser?.userRole ?? DEFAULT_USER_ROLE) as
      | v2UserRole
      | v2AdminRole;
    const identifier =
      currentUser?.email ?? currentUser?.userId ?? currentUser?.telephone ?? "";
    setUser({ role, identifier });
    router.push(path(isAdminRole(role) ? "/admin" : "/client"));
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  const { mutateAsync: completeProfile } = useMutation({
    ...userServiceCompleteProfileMutation(),
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? t("common.errorOccured"));
    },
  });

  return (
    <SignupLayout
      showProgress={false}
      onBack={handleBack}
      backgroundImage="/assets/complete-profile-bg.png"
    >
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-primary text-center">
            {t("profile.completeYourProfile")}
          </h1>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            {t("profile.completeSubtitle")}
          </p>
        </div>

        <div className="space-y-4">
          {/* Full name – always visible */}
          <FormInput
            label={t("profile.fullName")}
            required
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fullNameError) setFullNameError(null);
            }}
            onBlur={() => {
              if (fullName.trim()) setFullNameError(null);
            }}
            error={fullNameError || undefined}
            placeholder="Marie Bliss"
          />

          {/* Phone – appears after first Continue */}
          {step >= 1 && (
            <PhoneInput
              value={phone}
              onChange={setPhone}
              onCountryChange={(c) => setDialCode(c.dial_code)}
              defaultCountryCode={
                currentUser?.telephone
                  ? parseStoredPhone(currentUser.telephone).dialCode
                  : undefined
              }
              disabled={isPhoneSignup}
              required={!isPhoneSignup}
            />
          )}

          {/* Email – appears after second Continue */}
          {step >= 2 && (
            <FormInput
              label={t("auth.emailAddress")}
              type="email"
              required={isPhoneSignup}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              error={emailError || undefined}
              placeholder="mariebliss24@gmail.com"
              disabled={!isPhoneSignup}
            />
          )}

          {/* Location – same step as email for email signup, next step for phone signup */}
          {showLocation && (
            <FormInput
              label={t("profile.location")}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Buea-Cameroon"
            />
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {!isLastStep ? (
              <Button
                type="button"
                onClick={handleContinue}
                className="w-full h-11 bg-primary text-primary-foreground"
              >
                {t("common.continue")}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full h-11 bg-primary text-primary-foreground"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t("profile.saving")}
                  </>
                ) : (
                  t("common.save")
                )}
              </Button>
            )}
            <button
              type="button"
              onClick={handleDoItLater}
              className="w-full h-10 text-secondary font-medium underline"
            >
              {t("profile.doItLater")}
            </button>
          </div>
        </div>
      </div>
    </SignupLayout>
  );
}
