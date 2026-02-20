'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SignupLayout } from '@/components/auth/signup-layout';
import { FormInput } from '@/components/auth/form-input';
import { useLocalePath } from '@/lib/use-locale';
import { useT } from '@/app/i18n/client';
import { createPasswordSchema } from '@/lib/form-validators';
import { toast } from 'sonner';
import { z } from 'zod';
import { MdLockOutline, MdLockOpen } from 'react-icons/md';
import { useForgotPassword } from '@/contexts/forgot-password-context';
import { useMutation } from '@tanstack/react-query';
import { userServiceResetPasswordMutation } from '@/@hey_api/users.swagger/@tanstack/react-query.gen';

function ForgotPasswordNewPasswordContent() {
  const router = useRouter();
  const path = useLocalePath();
  const searchParams = useSearchParams();
  const { t } = useT('translation');
  const {
    mode,
    requestId,
    otp,
    phoneNumber: contextPhoneNumber,
    email: contextEmail,
    emailVerificationToken,
    clearForgotPassword,
  } = useForgotPassword();
  const passwordSchema = useMemo(() => createPasswordSchema(t), [t]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const emailFromUrl = searchParams.get('email');
  const tokenFromUrl = searchParams.get('token');
  const email = contextEmail ?? emailFromUrl ?? null;
  const emailToken = emailVerificationToken ?? tokenFromUrl ?? null;
  const phoneNumber = contextPhoneNumber ?? null;

  const canResetWithPhone = mode === 'phone' && requestId && otp && phoneNumber;
  const canResetWithEmail = (mode === 'email' || emailFromUrl) && email && emailToken;

  useEffect(() => {
    if (!canResetWithPhone && !canResetWithEmail) {
      router.replace(path('/auth/forgot-password'));
    }
  }, [canResetWithPhone, canResetWithEmail, router, path]);

  const validatePasswords = (pwd: string, confirm: string) => {
    try {
      passwordSchema.parse({ password: pwd, confirmPassword: confirm });
      setPasswordError(null);
      setConfirmError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          if (err.path[0] === 'password') {
            setPasswordError(err.message);
          } else if (err.path[0] === 'confirmPassword') {
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
    if (passwordError) validatePasswords(value, confirmPassword);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (confirmError) validatePasswords(password, value);
  };

  const { mutateAsync: resetPassword } = useMutation({
    ...userServiceResetPasswordMutation(),
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? t('auth.errorOccurred'));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswords(password, confirmPassword)) return;

    setIsLoading(true);
    try {
      if (canResetWithPhone) {
        await resetPassword({
          body: {
            authFactor: {
              type: 'FACTOR_TYPE_SMS_OTP',
              id: requestId!,
              secretValue: otp!,
            },
            phoneNumber: phoneNumber,
            newPassword: password,
          },
        });
      } else if (canResetWithEmail && email && emailToken) {
        await resetPassword({
          body: {
            authFactor: {
              type: 'FACTOR_TYPE_EMAIL_VERIFICATION',
              id: email,
              secretValue: emailToken,
            },
            email: email,
            newPassword: password,
          },
        });
      } else {
        toast.error(t('auth.errorOccurred'));
        setIsLoading(false);
        return;
      }

      clearForgotPassword();
      toast.success(t('auth.passwordResetSuccess'));
      router.replace(path('/auth/signin'));
    } catch {
      // onError toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => router.back();

  const isFormValid =
    password && confirmPassword && !passwordError && !confirmError;

  if (!canResetWithPhone && !canResetWithEmail) {
    return null;
  }

  return (
    <SignupLayout
      showProgress={false}
      onBack={handleBack}
      backgroundImage="/assets/password-bg.png"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-primary text-center">
            {t('auth.newPassword')}
          </h2>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            {t('auth.newPasswordSubtitle')}
          </p>
        </div>

        <div className="relative">
          <FormInput
            label={t('auth.createPasswordLabel')}
            type={showPassword ? 'text' : 'password'}
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
            className="absolute right-3 top-[38px] cursor-pointer text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <MdLockOpen className="w-4 h-4" />
            ) : (
              <MdLockOutline className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="relative">
          <FormInput
            label={t('auth.confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
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
            className="absolute right-3 top-[38px] cursor-pointer text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? (
              <MdLockOpen className="w-4 h-4" />
            ) : (
              <MdLockOutline className="w-4 h-4" />
            )}
          </button>
        </div>

        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className={`w-full h-11 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
            !isFormValid || isLoading
              ? 'bg-slate-500 cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90 active:bg-primary/80'
          }`}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('auth.creating')}</span>
            </>
          ) : (
            t('auth.resetPasswordButton')
          )}
        </button>
      </form>
    </SignupLayout>
  );
}

export default function ForgotPasswordNewPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordNewPasswordContent />
    </Suspense>
  );
}
