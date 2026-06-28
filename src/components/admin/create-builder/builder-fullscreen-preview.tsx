"use client";

import { useState } from "react";
import { CreateWizardShell } from "@/components/create/create-wizard-shell";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEFAULT_CREATE_DRAFT, type CreateCharacterDraft } from "@/lib/characters/create-draft";
import type { CreationConfig } from "@/types/character-creation-config";

interface BuilderFullscreenPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CreationConfig;
}

export function BuilderFullscreenPreview({
  open,
  onOpenChange,
  config,
}: BuilderFullscreenPreviewProps) {
  const [draft, setDraft] = useState<CreateCharacterDraft>(DEFAULT_CREATE_DRAFT);
  const [step, setStep] = useState(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[100dvh] max-h-[100dvh] w-[100vw] max-w-[100vw] gap-0 overflow-hidden border-0 bg-black p-0 sm:max-w-[100vw]">
        <DialogHeader className="sr-only">
          <DialogTitle>Preview character creation wizard</DialogTitle>
        </DialogHeader>
        <CreateWizardShell
          config={config}
          mode="fullscreen-preview"
          draft={draft}
          onDraftChange={setDraft}
          previewStep={step}
          onPreviewStepChange={setStep}
          device="desktop"
        />
      </DialogContent>
    </Dialog>
  );
}
