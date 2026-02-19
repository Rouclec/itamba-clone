"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Phone } from "lucide-react";
import { MdLockOutline, MdLockOpen } from "react-icons/md";
import { SignupLayout } from "@/components/auth/signup-layout";
import { PhoneInput } from "@/components/auth/phone-input";
import { FormInput } from "@/components/auth/form-input";
import { Button } from "@/components/ui/button";
import { LocaleLink } from "@/components/locale-link";
import { useAuth } from "@/lib/auth-context";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { toast } from "sonner";
import type { Country } from "@/lib/countries";
import { toFullNumber, isValidPhone, normalizePhone } from "@/utils/phone";
import { useMutation } from "@tanstack/react-query";
import { userServiceAuthenticateMutation } from "@/@hey_api/users.swagger/@tanstack/react-query.gen";
import { setAuthorizationHeaders } from "@/utils/inteceptor";
import { setRefreshTokenInStorage } from "@/utils/auth/session";
import { fetchUserById } from "@/hooks/use-user";
import { isAdminRole, DEFAULT_USER_ROLE } from "@/utils/auth/role";
import type { v2UserRole, v2AdminRole } from "@/@hey_api/users.swagger";

export default function SignInPage() {
  const router = useRouter();
  const { setUser, setCurrentUser, setUserId } = useAuth();
  const path = useLocalePath();
  const { t } = useT("translation");
  const [method, setMethod] = useState<"phone" | "email">("phone");

  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("+237");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (value: string): boolean => {
    const full = toFullNumber(dialCode, value);
    if (!full || !isValidPhone(full)) {
      setPhoneError(t('auth.validPhone'));
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const validateEmail = (value: string): boolean => {
    const trimmed = value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!trimmed || !valid) {
      setEmailError(t('auth.validEmail'));
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (): boolean => {
    if (!password || password.length < 6) {
      setPasswordError(t('auth.passwordMinLength'));
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const { mutateAsync: authenticate } = useMutation({
    ...userServiceAuthenticateMutation(),
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? t("auth.errorOccurred"));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (method === "phone") {
      if (!validatePhone(phone) || !validatePassword()) return;
    } else {
      if (!validateEmail(email) || !validatePassword()) return;
    }

    const factorId =
      method === "phone"
        ? (normalizePhone(dialCode, phone) ?? toFullNumber(dialCode, phone) ?? "")
        : email.trim();
    const factorType =
      method === "phone" ? "FACTOR_TYPE_PHONE_PASSWORD" : "FACTOR_TYPE_EMAIL_PASSWORD";

    setIsLoading(true);
    try {
      const data = await authenticate({
        body: {
          authFactors: [
            { type: factorType, id: factorId, secretValue: password },
          ],
        },
      });

      const accessToken = data?.tokens?.accessToken ?? "";
      const refreshToken = data?.tokens?.refreshToken;
      const userId = data?.userId;

      if (!accessToken || !userId) {
        toast.error(t("auth.errorOccurred"));
        return;
      }

      setAuthorizationHeaders(accessToken);
      if (refreshToken) setRefreshTokenInStorage(refreshToken);
      setUserId(userId);

      const freshUser = await fetchUserById(userId);
      if (!freshUser) {
        toast.error(t("auth.errorOccurred"));
        return;
      }

      setCurrentUser(freshUser);
      const role = (freshUser.userRole ?? DEFAULT_USER_ROLE) as
        | v2UserRole
        | v2AdminRole;
      const identifier =
        freshUser.email ?? freshUser.userId ?? freshUser.telephone ?? "";
      setUser({ role, identifier });

      toast.success(t("auth.signIn"));
      router.push(path(isAdminRole(role) ? "/admin" : "/client"));
    } catch {
      // onError toast handled by mutation
    } finally {
      setIsLoading(false);
    }
  };

  const switchToEmail = () => {
    setMethod("email");
    setPhoneError(null);
  };

  const switchToPhone = () => {
    setMethod("phone");
    setEmailError(null);
  };

  const isFormValid =
    method === "phone"
      ? isValidPhone(toFullNumber(dialCode, phone)) &&
        password.length >= 6 &&
        !phoneError &&
        !passwordError
      : email.trim().length > 0 &&
        password.length >= 6 &&
        !emailError &&
        !passwordError;

  

  return (
    <SignupLayout showProgress={false} onBack={() => router.back()}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-primary text-center">
            {t('auth.signInToItamba')}
          </h1>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            {t('auth.signInSubtitle')}
          </p>
        </div>

        {method === "phone" ? (
          <>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              onCountryChange={(c: Country) => setDialCode(c.dial_code)}
              onBlur={() => phone && validatePhone(phone)}
              error={phoneError || undefined}
              required
            />
          </>
        ) : (
          <FormInput
            label={t('auth.emailAddress')}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            onBlur={() => email && validateEmail(email)}
            error={emailError ?? undefined}
            placeholder="you@example.com"
            required
          />
        )}

        <div className="relative">
          <FormInput
            label={t("auth.password")}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            onBlur={validatePassword}
            error={passwordError ?? undefined}
            placeholder="********"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] cursor-pointer text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <MdLockOpen className="w-4 h-4" />
            ) : (
              <MdLockOutline className="w-4 h-4" />
            )}
          </button>
        </div>

        <Button
          type="submit"
          disabled={!isFormValid || isLoading}
          className={`w-full h-11 text-white transition-all ${
            !isFormValid || isLoading
              ? "bg-slate-500 cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {t('auth.signingIn')}
            </>
          ) : (
            t('auth.signIn')
          )}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-muted-foreground">{t('common.or')}</span>
          </div>
        </div>

        {method === "phone" ? (
          <Button
            type="button"
            variant="secondary"
            onClick={switchToEmail}
            className="w-full h-11 font-normal"
          >
            <Image
              src="/assets/mail.png"
              alt=""
              width={20}
              height={20}
              className="shrink-0"
            />
            {t('auth.continueWithEmail')}
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={switchToPhone}
            className="w-full h-11 font-normal"
          >
            <Phone className="w-5 h-5 shrink-0" />
            {t('auth.continueWithPhone')}
          </Button>
        )}

        <p className="text-base font-medium text-center">
          {t('auth.dontHaveAccount')}{" "}
          <LocaleLink
            href="/auth/signup"
            className="text-secondary hover:underline font-medium"
          >
            {t('auth.goToSignUp')}
          </LocaleLink>
        </p>
      </form>
    </SignupLayout>
  );
}
