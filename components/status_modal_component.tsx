"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, XCircle } from "lucide-react";

export interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: "success" | "error";
  heading: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export function StatusModal({
  isOpen,
  onClose,
  status,
  heading,
  description,
  buttonText,
  onButtonClick,
}: StatusModalProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  const handleButtonClick = () => {
    onButtonClick?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-w-sm flex-col items-center gap-4 p-6 text-center"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
          {status === "success" ? (
            <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-full">
              <Check className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
            </div>
          ) : (
            <div className="bg-destructive flex h-12 w-12 items-center justify-center rounded-full">
              <XCircle className="h-6 w-6 text-destructive-foreground" strokeWidth={2.5} />
            </div>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">{heading}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {buttonText && (
          <Button className="w-full" onClick={handleButtonClick}>
            {buttonText}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
