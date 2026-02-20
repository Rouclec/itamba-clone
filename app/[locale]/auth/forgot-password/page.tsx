'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Phone } from 'lucide-react';
import { SignupLayout } from '@/components/auth/signup-layout';
import { PhoneInput } from '@/components/auth/phone-input';
import { FormInput } from '@/components/auth/form-input';
import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/components/locale-link';
import { useLocalePath } from '@/lib/use-locale';
import { useT } from '@/app/i18n/client';
import { toFullNumber, isValidPhone } from '@/utils/phone';
import { useForgotPassword } from '@/contexts/forgot-password-context';
import { useMutation } from '@tanstack/react-query';
import {
  userServiceSendResetPasswordOtpMutation,
  userServiceSendResetPasswordEmailVerificationLinkMutation,
} from '@/@hey_api/users.swagger/@tanstack/react-query.gen';
import { toast } from 'sonner';
import type { Country } from '@/lib/countries';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const path = useLocalePath();
  const { t } = useT('translation');
  const { setForgotPassword } = useForgotPassword();

  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [dialCode, setDialCode] = useState('+237');
  const [email, setEmail] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
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

  const { mutateAsync: sendResetOtp } = useMutation({
    ...userServiceSendResetPasswordOtpMutation(),
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? t('auth.errorOccurred'));
    },
  });

  const { mutateAsync: sendResetEmailLink } = useMutation({
    ...userServiceSendResetPasswordEmailVerificationLinkMutation(),
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? t('auth.errorOccurred'));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (method === 'phone') {
      if (!validatePhone(phone)) return;
      const fullPhone = toFullNumber(dialCode, phone);
      setIsLoading(true);
      try {
        const data = await sendResetOtp({ body: { phoneNumber: fullPhone } });
        const requestId = data?.requestId ?? null;
        if (requestId) {
          setForgotPassword({
            mode: 'phone',
            requestId,
            phoneNumber: fullPhone,
            email: null,
          });
          toast.success(t('auth.otpSentSuccess'));
          router.push(path('/auth/forgot-password/otp'));
        }
      } catch {
        // onError toast
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!validateEmail(email)) return;
    setIsLoading(true);
    try {
      await sendResetEmailLink({ body: { email: email.trim() } });
      setForgotPassword({
        mode: 'email',
        email: email.trim(),
        requestId: null,
        phoneNumber: null,
      });
      toast.success(t('auth.emailVerificationSent'));
      router.push(path('/auth/forgot-password/email-sent'));
    } catch {
      // onError toast
    } finally {
      setIsLoading(false);
    }
  };

  const switchToEmail = () => {
    setMethod('email');
    setPhoneError(null);
  };

  const switchToPhone = () => {
    setMethod('phone');
    setEmailError(null);
  };

  const isFormValid =
    method === 'phone'
      ? isValidPhone(toFullNumber(dialCode, phone)) && !phoneError
      : email.trim().length > 0 && !emailError;

  return (
    <SignupLayout showProgress={false} onBack={() => router.back()}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-primary text-center">
            {t('auth.forgotPassword')}
          </h1>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            {t('auth.forgotPasswordSubtitle')}
          </p>
        </div>

        {method === 'phone' ? (
          <PhoneInput
            value={phone}
            onChange={setPhone}
            onCountryChange={(c: Country) => setDialCode(c.dial_code)}
            onBlur={() => phone && validatePhone(phone)}
            error={phoneError || undefined}
            required
          />
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

        <Button
          type="submit"
          disabled={!isFormValid || isLoading}
          className={`w-full h-11 text-white transition-all ${
            !isFormValid || isLoading
              ? 'bg-slate-500 cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {t('auth.sending')}
            </>
          ) : (
            t('common.continue')
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-muted-foreground">{t('common.or')}</span>
          </div>
        </div>

        {method === 'phone' ? (
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
          <LocaleLink
            href="/auth/signin"
            className="text-secondary hover:underline font-medium"
          >
            {t('auth.backToSignIn')}
          </LocaleLink>
        </p>
      </form>
    </SignupLayout>
  );
}
