"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  errorMessage = "Verification failed. Please try again.",
  successMessage = "Verified successfully!",
  message,
  onRetry,
  onBack,
}: VerificationLoaderProps) {
  const [displayError, setDisplayError] = useState(isError);

  useEffect(() => {
    if (isError) {
      setDisplayError(true);
    }
  }, [isError]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          {isLoading && (
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
              ? "Verification Failed"
              : isLoading
                ? "Verifying..."
                : "Verified!"}
          </h2>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            {displayError ? errorMessage : isLoading ? message : successMessage}
          </p>
        </div>

        {/* Loading spinner text */}
        {isLoading && (
          <div className="text-center text-sm text-muted-foreground animate-pulse">
            This may take a few moments...
          </div>
        )}

        {/* Action Buttons */}
        {displayError && (
          <div className="flex gap-3">
            {onRetry && (
              <Button onClick={onRetry} variant="default" className="flex-1">
                Try Again
              </Button>
            )}
            {onBack && (
              <Button onClick={onBack} variant="outline" className="flex-1">
                Return to Home
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
