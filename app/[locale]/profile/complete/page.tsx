"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignupLayout } from "@/components/auth/signup-layout";
import { FormInput } from "@/components/auth/form-input";
import { PhoneInput } from "@/components/auth/phone-input";
import { Button } from "@/components/ui/button";
import { useSignupContext } from "@/lib/signup-context";
import { useAuth } from "@/lib/auth-context";
import { useLocalePath } from "@/lib/use-locale";
import { appRoleToApiRole } from "@/utils/auth/role";
import { useT } from "@/app/i18n/client";
import { Loader2 } from "lucide-react";

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
  const { t } = useT('translation');
  const { formData, updateFormData, resetFormData } = useSignupContext();
  const { setUser } = useAuth();
  const isPhoneSignup = formData.verificationMethod === "phone";

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(() => {
    const { national } = parseStoredPhone(formData.phone);
    return national;
  });
  const [dialCode, setDialCode] = useState(
    () => parseStoredPhone(formData.phone).dialCode,
  );
  const [email, setEmail] = useState(formData.email || "");
  const [location, setLocation] = useState("");
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
        setFullNameError(t('profile.pleaseEnterFullName'));
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
        setEmailError(t('profile.pleaseEnterEmail'));
        return;
      }
      setEmailError(null);
      setStep(3);
      return;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    const finalEmail = email || formData.email || "";
    const finalPhone = formData.phone || dialCode + phone.replace(/\D/g, "");
    updateFormData({
      email: finalEmail || formData.email,
      phone: finalPhone || formData.phone,
    });
    const identifier = finalEmail || finalPhone;
    const appRole = finalEmail.toLowerCase().trim() === "admin@example.com" ? "admin" : "client";
    const role = appRoleToApiRole(appRole);
    setUser({ role, identifier });
    resetFormData();
    router.push(path(appRole === "admin" ? "/admin" : "/client"));
  };

  const handleDoItLater = () => {
    const identifier = formData.email || formData.phone || "";
    const appRole = (formData.email || "").toLowerCase().trim() === "admin@example.com" ? "admin" : "client";
    const role = appRoleToApiRole(appRole);
    setUser({ role, identifier });
    resetFormData();
    router.push(path(appRole === "admin" ? "/admin" : "/client"));
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  return (
    <SignupLayout
      showProgress={false}
      onBack={handleBack}
      backgroundImage="/assets/complete-profile-bg.png"
    >
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-primary text-center">
            {t('profile.completeYourProfile')}
          </h1>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            {t('profile.completeSubtitle')}
          </p>
        </div>

        <div className="space-y-4">
          {/* Full name – always visible */}
          <FormInput
            label={t('profile.fullName')}
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
                formData.phone
                  ? parseStoredPhone(formData.phone).dialCode
                  : undefined
              }
              disabled={isPhoneSignup}
              required={!isPhoneSignup}
            />
          )}

          {/* Email – appears after second Continue */}
          {step >= 2 && (
            <FormInput
              label={t('auth.emailAddress')}
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
              label={t('profile.location')}
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
                {t('common.continue')}
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
                    {t('profile.saving')}
                  </>
                ) : (
                  t('common.save')
                )}
              </Button>
            )}
            <button
              type="button"
              onClick={handleDoItLater}
              className="w-full h-10 text-secondary font-medium underline"
            >
              {t('profile.doItLater')}
            </button>
          </div>
        </div>
      </div>
    </SignupLayout>
  );
}
