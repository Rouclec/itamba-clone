"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SignupLayout } from "@/components/auth/signup-layout";
import { FormInput } from "@/components/auth/form-input";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import {
  createPasswordSchema,
} from "@/lib/form-validators";
import { toast } from "sonner";
import { z } from "zod";
import { MdLockOutline, MdLockOpen } from "react-icons/md";
import { useAuth } from "@/lib/auth-context";

export default function PasswordPage() {
  const router = useRouter();
  const path = useLocalePath();
  const { t } = useT("translation");
  const { signupRequest, setSignupRequest } = useAuth();
  const passwordSchema = useMemo(() => createPasswordSchema(t), [t]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validatePasswords = (pwd: string, confirm: string) => {
    try {
      passwordSchema.parse({ password: pwd, confirmPassword: confirm });
      setPasswordError(null);
      setConfirmError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Separate errors for each field
        error.errors.forEach((err) => {
          if (err.path[0] === "password") {
            setPasswordError(err.message);
          } else if (err.path[0] === "confirmPassword") {
            setConfirmError(err.message);
          }
        });
      }
      return false;
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordError) {
      validatePasswords(value, confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (confirmError) {
      validatePasswords(password, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswords(password, confirmPassword)) {
      return;
    }

    setIsLoading(true);
    try {
      setSignupRequest({
        ...signupRequest,
        password: password,
      });

      toast.success(t("auth.passwordCreated"));

      router.push(path("/auth/signup/career"));
    } catch (error) {
      toast.error(t("auth.errorOccurred"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isFormValid =
    password && confirmPassword && !passwordError && !confirmError;

  return (
    <SignupLayout
      currentStep={3}
      totalSteps={4}
      onBack={handleBack}
      backgroundImage="/assets/password-bg.png"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-primary text-center">
            {t("auth.createPassword")}
          </h2>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            {t("auth.createPasswordSubtitle")}
          </p>
        </div>

        {/* Password Input */}
        <div className="relative">
          <FormInput
            label={t("auth.createPasswordLabel")}
            type={showPassword ? "text" : "password"}
            placeholder="********"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => validatePasswords(password, confirmPassword)}
            error={passwordError || undefined}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px]  cursor-pointer text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <MdLockOpen className="w-4 h-4" />
            ) : (
              <MdLockOutline className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Confirm Password Input */}
        <div className="relative">
          <FormInput
            label={t("auth.confirmPassword")}
            type={showConfirmPassword ? "text" : "password"}
            placeholder="********"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            onBlur={() => validatePasswords(password, confirmPassword)}
            error={confirmError || undefined}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-[38px]  cursor-pointer text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? (
              <MdLockOpen className="w-4 h-4" />
            ) : (
              <MdLockOutline className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Password Requirements */}
        {/* <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <p className="text-xs font-semibold text-foreground">Password requirements:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• At least 8 characters</li>
            <li>• At least one uppercase letter</li>
            <li>• At least one lowercase letter</li>
            <li>• At least one number</li>
          </ul>
        </div> */}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className={`w-full h-11 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
            !isFormValid || isLoading
              ? "bg-slate-500 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 active:bg-primary/80"
          }`}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t("auth.creating")}</span>
            </>
          ) : (
            t("auth.createPasswordButton")
          )}
        </button>
      </form>
    </SignupLayout>
  );
}
