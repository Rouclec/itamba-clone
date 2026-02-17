"use client";

import Image from "next/image";
import { LocaleLink } from "@/components/locale-link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/app/i18n/client";

interface SignupLayoutProps {
  children: React.ReactNode;
  backgroundImage?: string;
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function SignupLayout({
  children,
  backgroundImage = "/assets/signup-bg.png",
  showProgress = true,
  currentStep = 1,
  totalSteps = 4,
  showBackButton = true,
  onBack,
}: SignupLayoutProps) {
  const { t } = useT('translation');

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left Sidebar - Hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 relative bg-sidebar overflow-hidden flex-col justify-between p-8">
        {/* Background Image + overlay gradient (transparent → purple → blue) */}
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImage}
            alt="Library background"
            fill
            className="object-cover"
            priority
            quality={75}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, #00000000 0%, #00000000 28%, #9A33FD66 60%, #9A33FD66 67%, #4135BBC7 80%, #0D3695 100%)',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-end">
          <div className="text-sidebar-foreground space-y-4">
            <div className="text-sm font-medium text-sidebar-accent">
              {t('signupLayout.yourOnlineLibrary')}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              {t('signupLayout.sidebarTagline')}
            </h1>
          </div>
        </div>

        {/* Progress Indicator */}
        {showProgress && (
          <div className="relative z-10 mt-12 max-w-90 flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-sm transition-colors",
                  i < currentStep ? "bg-white" : "bg-sidebar-foreground/20",
                )}
              />
            ))}
            <span className="text-sidebar-foreground text-sm font-medium ml-2">
              {currentStep}/{totalSteps}
            </span>
          </div>
        )}
      </div>

      {/* Right Content Area - light gray with background pattern */}
      <div className="w-full md:w-1/2 flex flex-col relative min-h-screen md:pl-4">
        <div className="absolute inset-0 z-0" />
        {/* Pattern layer */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/assets/itamba_pattern.png')",
          }}
        />
        <div className="relative z-10 flex flex-col flex-1 min-w-0">
          {/* Mobile: Progress & Back */}
          <div className="md:hidden p-4 flex items-center justify-between border-b border-border">
            {showBackButton ? (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                aria-label={t('common.back')}
              >
                <span className="text-sm font-semibold">{t('common.back')}</span>
              </button>
            ) : (
              <div />
            )}
            {showProgress && (
              <span className="text-xs font-medium text-muted-foreground">
                {currentStep}/{totalSteps}
              </span>
            )}
          </div>

          {/* Desktop: logo and back at top – same width as form (same wrapper + padding) */}
          <div className="hidden md:block shrink-0 p-4 md:pt-8 md:pb-0 md:px-8">
            <div className="w-full max-w-[554px] min-w-0 flex items-center justify-between">
              <LocaleLink href="/" className="flex items-start gap-2 shrink-0">
                <div className="relative h-11 w-12 shrink-0">
                  <Image
                    src="/assets/logo.png"
                    alt="Itamba"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col justify-center leading-none">
                  <div className="font-extrabold leading-none text-2xl text-primary">
                    Itamba
                  </div>
                  <div className="text-xs text-[#9A33FD] leading-tight">
                    {t('signupLayout.legalLibrary')}
                  </div>
                </div>
              </LocaleLink>

              {showBackButton && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 text-foreground hover:text-primary transition-colors shrink-0"
                  aria-label={t('common.back')}
                >
                  <div className="w-8 h-8 bg-[#F0F0F0] rounded-sm flex items-center justify-center">
                    <ArrowLeft className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-lg font-semibold">{t('common.back')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Form area: vertically centered – same wrapper width as navbar */}
          <div className="flex-1 overflow-y-auto flex flex-col md:justify-center md:items-start min-h-0 p-4 md:p-8">
            <div className="w-full max-w-[554px] md:min-w-0">
              <div className="bg-white rounded-xl border border-border p-6 md:p-8">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
