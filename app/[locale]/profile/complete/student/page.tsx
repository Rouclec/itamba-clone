"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignupLayout } from "@/components/auth/signup-layout";
import { FormInput } from "@/components/auth/form-input";
import { Button } from "@/components/ui/button";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DocumentUpload,
  type StudentDocumentType,
} from "@/components/profile/document-upload";

const TOTAL_STEPS = 2;
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) => CURRENT_YEAR - 15 + i);

export default function StudentCompleteProfilePage() {
  const router = useRouter();
  const path = useLocalePath();
  const { t } = useT("translation");

  const [step, setStep] = useState(0);
  const [schoolName, setSchoolName] = useState("");
  const [location, setLocation] = useState("");
  const [yearFrom, setYearFrom] = useState<string>("");
  const [yearTo, setYearTo] = useState<string>("");
  const [documentType, setDocumentType] =
    useState<StudentDocumentType>("school_fee_receipt");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(
    undefined,
  );

  const canContinueStep1 =
    schoolName.trim() !== "" &&
    location.trim() !== "" &&
    yearFrom !== "" &&
    yearTo !== "";

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  const handleContinue = () => {
    if (step === 0 && canContinueStep1) setStep(1);
  };

  const handleSave = () => {
    // UI only: no API call yet
    if (file) {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((p) => {
          if ((p ?? 0) >= 100) {
            clearInterval(interval);
            return 100;
          }
          return (p ?? 0) + 20;
        });
      }, 200);
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        router.push(path("/client"));
      }, 1200);
    }
  };

  const saveDisabled = !file;

  return (
    <SignupLayout
      showProgress
      currentStep={step + 1}
      totalSteps={TOTAL_STEPS}
      showBackButton
      onBack={handleBack}
      backgroundImage="/assets/student-kyc.png"
    >
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-primary text-center">
            {t("studentProfile.title")}
          </h1>
          <p className="text-center text-muted-foreground text-base font-medium leading-relaxed">
            {t("studentProfile.subtitle")}
          </p>
        </div>

        {step === 0 && (
          <>
            <FormInput
              label={t("studentProfile.schoolName")}
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="University of Buea"
            />
            <FormInput
              label={t("studentProfile.location")}
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Buea"
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                {t("studentProfile.academicYear")}
                <span className="text-destructive ml-1">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">
                    {t("studentProfile.from")}
                  </span>
                  <Select
                    value={yearFrom}
                    onValueChange={setYearFrom}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_OPTIONS.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">
                    {t("studentProfile.to")}
                  </span>
                  <Select value={yearTo} onValueChange={setYearTo}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_OPTIONS.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleContinue}
              disabled={!canContinueStep1}
              className={`w-full h-11 ${
                canContinueStep1
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-slate-400 text-white cursor-not-allowed"
              }`}
            >
              {t("studentProfile.continue")}
            </Button>
          </>
        )}

        {step === 1 && (
          <>
            <DocumentUpload
              documentType={documentType}
              onDocumentTypeChange={setDocumentType}
              file={file}
              onFileChange={setFile}
              progress={uploadProgress}
              t={t}
            />
            <Button
              type="button"
              onClick={handleSave}
              disabled={saveDisabled}
              className={`w-full h-11 ${
                saveDisabled
                  ? "bg-slate-400 text-white cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {t("studentProfile.save")}
            </Button>
          </>
        )}
      </div>
    </SignupLayout>
  );
}
