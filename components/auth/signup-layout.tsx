"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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
  backgroundImage = "https://images.unsplash.com/photo-1507842072343-583f20270319?w=800&q=80",
  showProgress = true,
  currentStep = 1,
  totalSteps = 4,
  showBackButton = true,
  onBack,
}: SignupLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left Sidebar - Hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 relative bg-sidebar overflow-hidden flex-col justify-between p-8">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImage}
            alt="Library background"
            fill
            className="object-cover"
            priority
            quality={75}
          />
          <div className="absolute inset-0 bg-linear-to-t from-sidebar via-sidebar/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-end">
          <div className="text-sidebar-foreground space-y-4">
            <div className="text-sm font-medium text-sidebar-accent">
              — Your Online Library —
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Well organized and up to date Cameroon law.
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
      <div className="w-full md:w-1/2 flex flex-col relative min-h-screen">
        <div className="absolute inset-0 z-0" />
        {/* Pattern layer – tint so we can see the layer; remove tint when pattern works */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/assets/itamba_pattern.png')",
          }}
        />
        <div className="relative z-10 flex flex-col flex-1">
          {/* Mobile Progress & Back. */}
          <div className="md:hidden p-4 flex items-center justify-between border-b border-border">
            {showBackButton ? (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                aria-label="Go back"
              >
                <div>{/* <ArrowLeft /> */}</div>
                <span className="text-sm font-medium">Back</span>
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

          {/* Header - Logo and Back Button (outside form card) */}
          <div className="hidden md:flex md:items-center md:justify-between p-6 md:p-8 border-b border-border">
            <Link href="/" className="flex items-start gap-2">
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
                  Legal Library
                </div>
              </div>
            </Link>

            {showBackButton && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                aria-label="Go back"
              >
                <div className="w-8 h-8 bg-[#ECF2FF] rounded-sm flex items-center justify-center">
                  <ArrowLeft className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">Back</span>
              </button>
            )}
          </div>

          {/* Form Content - in its own white container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center min-h-0">
            <div className="w-full max-w-md mx-auto">
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
