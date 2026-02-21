"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignupLayout } from "@/components/auth/signup-layout";
import { FormInput } from "@/components/auth/form-input";
import { Button } from "@/components/ui/button";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { useAuth } from "@/lib/auth-context";
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
import { useUploadKycDocument } from "@/hooks/use-upload-kyc-document";
import { toBackendDocumentType, getAxiosErrorMessage } from "@/utils/kyc-upload";
import { subscriptionsSaveKycDocumentsMutation } from "@/@hey_api/subscription.swagger/@tanstack/react-query.gen";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const TOTAL_STEPS = 2;
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from(
  { length: 20 },
  (_, i) => CURRENT_YEAR - 15 + i,
);

/** Convert year string (e.g. "2020") to ISO timestamp for 1st January (protobuf Timestamp). */
function yearToJanuaryFirstIso(year: string): string | undefined {
  const y = year ? parseInt(year, 10) : NaN;
  if (Number.isNaN(y)) return undefined;
  return `${y}-01-01T00:00:00.000Z`;
}

export default function StudentCompleteProfilePage() {
  const router = useRouter();
  const path = useLocalePath();
  const { t } = useT("translation");
  const { userId, currentUser } = useAuth();

  const [step, setStep] = useState(0);
  const [schoolName, setSchoolName] = useState("");
  const [location, setLocation] = useState("");
  const [yearFrom, setYearFrom] = useState<string>("");
  const [yearTo, setYearTo] = useState<string>("");
  const [yearFromError, setYearFromError] = useState<string | null>(null);
  const [yearToError, setYearToError] = useState<string | null>(null);
  const [documentType, setDocumentType] =
    useState<StudentDocumentType>("school_fee_receipt");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(
    undefined,
  );
  const [uploadError, setUploadError] = useState<string>("");

  const { upload: uploadKyc, isPending: isUploadPending } = useUploadKycDocument();
  const { mutateAsync: saveKyc, isPending: isSaving } = useMutation({
    ...subscriptionsSaveKycDocumentsMutation(),
    onError: (err) => {
      toast.error(getAxiosErrorMessage(err) || t("common.errorOccurred"));
    },
  });

  const validateAcademicYears = (): boolean => {
    const fromNum = yearFrom ? parseInt(yearFrom, 10) : NaN;
    const toNum = yearTo ? parseInt(yearTo, 10) : NaN;
    let valid = true;
    if (yearFrom && !Number.isNaN(fromNum) && fromNum > CURRENT_YEAR) {
      setYearFromError(t("studentProfile.yearFromCannotBeFuture"));
      valid = false;
    } else {
      setYearFromError(null);
    }
    if (yearTo && yearFrom && !Number.isNaN(toNum) && !Number.isNaN(fromNum) && toNum < fromNum) {
      setYearToError(t("studentProfile.yearToCannotBeBeforeFrom"));
      valid = false;
    } else {
      setYearToError(null);
    }
    return valid;
  };

  useEffect(() => {
    if (yearFrom || yearTo) validateAcademicYears();
  }, [yearFrom, yearTo]);

  const canContinueStep1 =
    schoolName.trim() !== "" &&
    location.trim() !== "" &&
    yearFrom !== "" &&
    yearTo !== "" &&
    !yearFromError &&
    !yearToError;

  const isUploading =
    uploadProgress !== undefined && uploadProgress >= 0 && uploadProgress < 100;

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  const handleContinue = () => {
    if (step === 0) {
      if (!validateAcademicYears()) return;
      if (canContinueStep1) setStep(1);
    }
  };

  const handleFileChange = (f: File | null) => {
    setFile(f);
    if (!f) {
      setUploadProgress(undefined);
      setUploadError("");
    }
  };

  const handleSave = async () => {
    if (!file || !userId) return;
    setUploadError("");
    setUploadProgress(0);

    let documentUrl: string;
    const backendDocumentType = toBackendDocumentType(documentType);
    try {
      const result = await uploadKyc(
        userId,
        file,
        documentType,
        (p) => setUploadProgress(p),
      );
      documentUrl = result.url;
      setUploadProgress(100);
    } catch (err) {
      const msg = getAxiosErrorMessage(err);
      setUploadError(
        msg ? `error uploading document: ${msg}` : "error uploading document",
      );
      setUploadProgress(undefined);
      return;
    }

    try {
      await saveKyc({
        path: { "document.userId": userId },
        body: {
          document: {
            documentUrl,
            documentType: backendDocumentType,
            schoolName: schoolName.trim(),
            location: location.trim(),
            startDate: yearToJanuaryFirstIso(yearFrom),
            endDate: yearToJanuaryFirstIso(yearTo),
            userName: currentUser?.fullName ?? undefined,
            userEmail: currentUser?.email ?? undefined,
            userPhone: currentUser?.telephone ?? undefined,
          },
        },
      });
      router.push(path("/profile/complete/student/success"));
    } catch {
      // toast from mutation onError
    }
  };

  const saveDisabled = !file || isUploading || isSaving || isUploadPending;

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
          <p className="text-center text-inactive-text text-base font-medium leading-relaxed">
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
                    onValueChange={(v) => {
                      setYearFrom(v);
                      setYearFromError(null);
                      if (yearToError) validateAcademicYears();
                    }}
                  >
                    <SelectTrigger
                      className={`w-full ${yearFromError ? "border-destructive" : ""}`}
                    >
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
                  {yearFromError && (
                    <p className="text-sm text-destructive font-medium">
                      {yearFromError}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">
                    {t("studentProfile.to")}
                  </span>
                  <Select
                    value={yearTo}
                    onValueChange={(v) => {
                      setYearTo(v);
                      setYearToError(null);
                      if (yearFromError) validateAcademicYears();
                    }}
                  >
                    <SelectTrigger
                      className={`w-full ${yearToError ? "border-destructive" : ""}`}
                    >
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
                  {yearToError && (
                    <p className="text-sm text-destructive font-medium">
                      {yearToError}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="w-full flex items-center justify-center">
              <Button
                type="button"
                onClick={handleContinue}
                disabled={!canContinueStep1}
                className={`w-fit h-11 ${
                  canContinueStep1
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-slate-400 text-white cursor-not-allowed"
                }`}
              >
                {t("studentProfile.continue")}
              </Button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <DocumentUpload
              documentType={documentType}
              onDocumentTypeChange={setDocumentType}
              file={file}
              onFileChange={handleFileChange}
              progress={uploadProgress}
              error={uploadError || undefined}
              disabled={isUploading || isSaving || isUploadPending}
              t={t}
            />
            <div className="w-full flex items-center justify-center">
              <Button
                type="button"
                onClick={handleSave}
                disabled={saveDisabled}
                className={`w-fit h-11 ${
                  saveDisabled
                    ? "bg-slate-400 text-white cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t("profile.saving")}
                  </>
                ) : (
                  t("studentProfile.save")
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </SignupLayout>
  );
}
