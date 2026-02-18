"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/app/i18n/client";

interface VerificationLoaderProps {
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
  successMessage?: string;
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export function VerificationLoader({
  isLoading,
  isError = false,
  errorMessage,
  successMessage,
  message,
  onRetry,
  onBack,
}: VerificationLoaderProps) {
  const { t } = useT('translation');
  const [displayError, setDisplayError] = useState(isError);
  const defaultError = t('verification.verificationFailedDefault');
  const defaultSuccess = t('verification.verified');
  const displayErrorMessage = errorMessage ?? defaultError;
  const displaySuccessMessage = successMessage ?? defaultSuccess;

  useEffect(() => {
    setDisplayError(isError);
  }, [isError]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full space-y-6">
        {/* Icon - show only one at a time to avoid loader + error glitch */}
        <div className="flex justify-center">
          {isLoading && !displayError && (
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
          )}
          {displayError && (
            <AlertCircle className="w-16 h-16 text-destructive" />
          )}
          {!isLoading && !displayError && (
            <CheckCircle2 className="w-16 h-16 text-green-500 animate-in fade-in zoom-in duration-300" />
          )}
        </div>

        {/* Message */}
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold text-center text-primary">
            {displayError
              ? t('verification.verificationFailed')
              : isLoading
                ? t('verification.verifying')
                : t('verification.verified')}
          </h2>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            {displayError ? displayErrorMessage : isLoading ? message : displaySuccessMessage}
          </p>
        </div>

        {/* Loading spinner text */}
        {isLoading && (
          <div className="text-center text-sm text-muted-foreground animate-pulse">
            {t('verification.mayTakeFewMoments')}
          </div>
        )}

        {/* Action Buttons */}
        {displayError && (
          <div className="flex gap-3">
            {onRetry && (
              <Button onClick={onRetry} variant="default" className="flex-1">
                {t('verification.tryAgain')}
              </Button>
            )}
            {onBack && (
              <Button onClick={onBack} variant="outline" className="flex-1">
                {t('verification.returnToHome')}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
