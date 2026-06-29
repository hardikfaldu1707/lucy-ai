"use client";

import { useMemo, useState } from "react";
import { CreateWizardShell } from "@/components/create/create-wizard-shell";
import { DEFAULT_CREATE_DRAFT, type CreateCharacterDraft } from "@/lib/characters/create-draft";
import { getEnabledSteps } from "@/lib/characters/creation-config-utils";
import { cn } from "@/lib/utils";
import type { CreationConfig } from "@/types/character-creation-config";
import { BuilderPreviewToolbar } from "./builder-preview-toolbar";

interface BuilderLivePreviewProps {
  config: CreationConfig;
  device: "desktop" | "mobile";
  onDeviceChange: (device: "desktop" | "mobile") => void;
  previewStep: number;
  onPreviewStepChange: (step: number) => void;
  onRestart: () => void;
  onFullscreen: () => void;
}

export function BuilderLivePreview({
  config,
  device,
  onDeviceChange,
  previewStep,
  onPreviewStepChange,
  onRestart,
  onFullscreen,
}: BuilderLivePreviewProps) {
  const [previewDraft, setPreviewDraft] = useState<CreateCharacterDraft>(DEFAULT_CREATE_DRAFT);
  const activeSteps = useMemo(() => getEnabledSteps(config), [config]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-black">
      <BuilderPreviewToolbar
        device={device}
        onDeviceChange={onDeviceChange}
        previewStep={previewStep}
        stepCount={Math.max(activeSteps.length, 1)}
        onPrev={() => onPreviewStepChange(Math.max(0, previewStep - 1))}
        onNext={() => onPreviewStepChange(Math.min(activeSteps.length - 1, previewStep + 1))}
        onRestart={() => {
          setPreviewDraft(DEFAULT_CREATE_DRAFT);
          onRestart();
        }}
        onFullscreen={onFullscreen}
      />
      <div className="flex flex-1 justify-center overflow-y-auto bg-zinc-950 p-2">
        <div
          className={cn(
            "w-full overflow-hidden rounded-lg ring-1 ring-white/10",
            device === "mobile" ? "max-w-[390px]" : "max-w-full",
          )}
        >
          <CreateWizardShell
            config={config}
            mode="preview"
            draft={previewDraft}
            onDraftChange={setPreviewDraft}
            previewStep={previewStep}
            onPreviewStepChange={onPreviewStepChange}
            device={device}
            hideFooter
            compact
          />
        </div>
      </div>
    </div>
  );
}
