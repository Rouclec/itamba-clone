"use client";

import { LocaleLink } from "@/components/locale-link";
import { Button } from "@/components/ui/button";
import { useT } from "@/app/i18n/client";

export default function Home() {
  const { t } = useT("translation");
  return (
    <main className="min-h-screen bg-linear-to-b from-background to-muted flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl space-y-8 text-center">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-linear-to-br from-primary via-purple-500 to-accent rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">I</span>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Itamba
          </h1>
          <p className="text-xl text-muted-foreground">{t("home.tagline")}</p>
        </div>

        {/* Description */}
        <p className="text-lg text-muted-foreground max-w-xl">
          {t("home.description")}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <LocaleLink href="/auth/signup">
            <Button size="lg" className="min-w-40">
              {t("home.signUp")}
            </Button>
          </LocaleLink>
          <LocaleLink href="/auth/signin">
            <Button size="lg" variant="outline" className="min-w-40">
              {t("home.signIn")}
            </Button>
          </LocaleLink>
        </div>

        {/* Development Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 text-sm">
          <LocaleLink
            href="/analytics"
            className="text-primary hover:underline"
          >
            {t("home.performanceAnalytics")}
          </LocaleLink>
          <span className="text-muted-foreground">•</span>
          <LocaleLink
            href="/load-test"
            className="text-primary hover:underline"
          >
            {t("home.loadTesting")}
          </LocaleLink>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
          <div className="p-6 bg-card rounded-lg border border-border">
            <div className="text-3xl mb-2">📚</div>
            <h3 className="font-semibold text-foreground mb-2">
              {t("home.comprehensive")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("home.comprehensiveDesc")}
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg border border-border">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-foreground mb-2">
              {t("home.fastReliable")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("home.fastReliableDesc")}
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg border border-border">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-semibold text-foreground mb-2">
              {t("home.secure")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("home.secureDesc")}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
