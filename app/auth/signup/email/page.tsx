"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { SignupLayout } from "@/components/auth/signup-layout";
import { FormInput } from "@/components/auth/form-input";
import { Button } from "@/components/ui/button";
import { useSignupContext } from "@/lib/signup-context";
import { emailSchema, type EmailFormData } from "@/lib/form-validators";
import { mockSendEmailVerification } from "@/lib/mock-api";
import { toast } from "sonner";
import { z } from "zod";
import Link from "next/link";

export default function EmailSignupPage() {
  const router = useRouter();
  const { formData, updateFormData } = useSignupContext();

  const [email, setEmail] = useState(formData.email || "");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (value: string) => {
    try {
      emailSchema.parse({ email: value });
      setEmailError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailError(error.errors[0].message);
      }
      return false;
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) {
      validateEmail(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await mockSendEmailVerification(email);

      if (result.success) {
        updateFormData({ email, userId: "temp_user" });
        toast.success(result.message);

        // Redirect to "email sent" page (check your inbox)
        setTimeout(() => {
          router.push(`/auth/signup/email/sent`);
        }, 500);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isFormValid = email && !emailError;

  return (
    <SignupLayout currentStep={1} totalSteps={4} onBack={handleBack}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-primary text-center">
            Sign up to Itamba
          </h1>
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
            Sign Up to enjoy well organized and up to date Cameroon law
          </p>
        </div>

        {/* Email Input */}
        <FormInput
          label="Email address"
          type="email"
          placeholder="Mariebliss@gmail.com"
          value={email}
          onChange={handleEmailChange}
          onBlur={() => validateEmail(email)}
          error={emailError || undefined}
          required
        />

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
              <span>Verifying...</span>
            </>
          ) : (
            "Verify email"
          )}
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-background text-muted-foreground">or</span>
          </div>
        </div>

        {/* Phone Alternative - secondary button */}
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            updateFormData({ verificationMethod: "phone" });
            router.push("/auth/signup/phone");
          }}
          className="w-full h-11"
        >
          <Phone className="w-5 h-5 shrink-0" />
          Continue with Phone number
        </Button>

        <div className="flex flex-col gap-4">
          {/* Terms */}
          <p className="text-base font-medium text-center leading-relaxed">
            By proceeding, you agree to our{" "}
            <Link
              href="#"
              className="text-secondary hover:underline font-medium"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="text-secondary hover:underline font-medium"
            >
              Privacy Policy
            </Link>
          </p>

          {/* Sign in link */}
          <p className="text-base font-medium text-center">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="text-secondary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </SignupLayout>
  );
}
