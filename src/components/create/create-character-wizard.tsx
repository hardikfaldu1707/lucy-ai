"use client";

import { CreateWizardShell } from "@/components/create/create-wizard-shell";
import { useCreationConfig } from "@/hooks/use-creation-config";
import type { CreateCharacterDraft } from "@/lib/characters/create-draft";

export interface CreateCharacterWizardProps {
  mode?: "create" | "edit";
  characterId?: string;
  initialDraft?: CreateCharacterDraft;
}

export function CreateCharacterWizard({
  mode = "create",
  characterId,
  initialDraft,
}: CreateCharacterWizardProps = {}) {
  const { data: config, isLoading, isError } = useCreationConfig();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-white/50">
        Loading creator…
      </div>
    );
  }

  if (isError || !config) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-white">
        <p className="text-lg font-semibold">Could not load creation wizard</p>
        <p className="mt-2 text-sm text-white/60">Please refresh and try again.</p>
      </div>
    );
  }

  return (
    <CreateWizardShell
      config={config}
      mode={mode}
      characterId={characterId}
      initialDraft={initialDraft}
    />
  );
}
