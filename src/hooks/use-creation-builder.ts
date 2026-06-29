"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  configFromPublishPayload,
  configToPublishPayload,
  configsEqual,
  CREATION_BUILDER_DRAFT_KEY,
} from "@/lib/characters/creation-config-utils";
import type { CreationConfig, CreationStep } from "@/types/character-creation-config";

function loadDraftFromStorage(): CreationConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CREATION_BUILDER_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CreationConfig;
  } catch {
    return null;
  }
}

function saveDraftToStorage(config: CreationConfig) {
  localStorage.setItem(CREATION_BUILDER_DRAFT_KEY, JSON.stringify(config));
}

export function useCreationBuilder(initialPublished: CreationConfig) {
  const [publishedConfig, setPublishedConfig] = useState(initialPublished);
  const [draftConfig, setDraftConfig] = useState(initialPublished);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    initialPublished.steps[0]?.id ?? null,
  );
  const [previewStep, setPreviewStep] = useState(0);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [showRestorePrompt, setShowRestorePrompt] = useState(() => {
    const stored = loadDraftFromStorage();
    return Boolean(stored && !configsEqual(stored, initialPublished));
  });
  const [storedDraft, setStoredDraft] = useState<CreationConfig | null>(() => {
    const stored = loadDraftFromStorage();
    if (stored && !configsEqual(stored, initialPublished)) return stored;
    return null;
  });

  const isDirty = useMemo(
    () => !configsEqual(draftConfig, publishedConfig),
    [draftConfig, publishedConfig],
  );

  const selectedStep = useMemo(
    () => draftConfig.steps.find((s) => s.id === selectedStepId) ?? null,
    [draftConfig, selectedStepId],
  );

  const updateDraft = useCallback((updater: (prev: CreationConfig) => CreationConfig) => {
    setDraftConfig((prev) => updater(prev));
  }, []);

  const updateStep = useCallback(
    (stepId: string, patch: Partial<CreationStep>) => {
      updateDraft((prev) => ({
        steps: prev.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
      }));
    },
    [updateDraft],
  );

  const reorderSteps = useCallback(
    (orderedIds: string[]) => {
      updateDraft((prev) => {
        const map = new Map(prev.steps.map((s) => [s.id, s]));
        return {
          steps: orderedIds
            .map((id, i) => {
              const step = map.get(id);
              return step ? { ...step, sortOrder: i } : null;
            })
            .filter(Boolean) as CreationStep[],
        };
      });
    },
    [updateDraft],
  );

  const duplicateStep = useCallback(
    (stepId: string) => {
      updateDraft((prev) => {
        const source = prev.steps.find((s) => s.id === stepId);
        if (!source) return prev;
        const newId = `temp-step-${Date.now()}`;
        const copy: CreationStep = {
          ...source,
          id: newId,
          stepKey: `${source.stepKey}-copy`,
          label: `${source.label} (copy)`,
          sortOrder: prev.steps.length,
          options: source.options.map((o, i) => ({
            ...o,
            id: `temp-opt-${Date.now()}-${i}`,
            stepId: newId,
          })),
        };
        return { steps: [...prev.steps, copy] };
      });
    },
    [updateDraft],
  );

  const deleteStep = useCallback(
    (stepId: string) => {
      updateDraft((prev) => ({
        steps: prev.steps.filter((s) => s.id !== stepId),
      }));
      setSelectedStepId((id) => (id === stepId ? null : id));
    },
    [updateDraft],
  );

  const addStep = useCallback(
    (step: Omit<CreationStep, "options"> & { options?: CreationStep["options"] }) => {
      updateDraft((prev) => ({
        steps: [
          ...prev.steps,
          {
            ...step,
            sortOrder: prev.steps.length,
            options: step.options ?? [],
          },
        ],
      }));
      setSelectedStepId(step.id);
    },
    [updateDraft],
  );

  const saveDraft = useCallback(() => {
    saveDraftToStorage(draftConfig);
    toast.success("Draft saved locally");
  }, [draftConfig]);

  const restoreDraft = useCallback(() => {
    if (storedDraft) {
      setDraftConfig(storedDraft);
      setShowRestorePrompt(false);
      toast.success("Draft restored");
    }
  }, [storedDraft]);

  const discardStoredDraft = useCallback(() => {
    localStorage.removeItem(CREATION_BUILDER_DRAFT_KEY);
    setShowRestorePrompt(false);
    setStoredDraft(null);
  }, []);

  const publish = useCallback(async () => {
    const payload = configToPublishPayload(draftConfig);
    const res = await fetch("/api/admin/creation-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? "Publish failed");
    }
    const json = (await res.json()) as { config: CreationConfig };
    setPublishedConfig(json.config);
    setDraftConfig(json.config);
    localStorage.removeItem(CREATION_BUILDER_DRAFT_KEY);
    toast.success("Changes published — live wizard updated");
    return json.config;
  }, [draftConfig]);

  const resetPreview = useCallback(() => setPreviewStep(0), []);

  return {
    publishedConfig,
    draftConfig,
    setDraftConfig,
    selectedStepId,
    setSelectedStepId,
    selectedStep,
    previewStep,
    setPreviewStep,
    device,
    setDevice,
    isDirty,
    updateDraft,
    updateStep,
    reorderSteps,
    duplicateStep,
    deleteStep,
    addStep,
    saveDraft,
    publish,
    resetPreview,
    showRestorePrompt,
    restoreDraft,
    discardStoredDraft,
  };
}

export function adminConfigFromServer(config: CreationConfig): CreationConfig {
  return configFromPublishPayload(configToPublishPayload(config));
}
