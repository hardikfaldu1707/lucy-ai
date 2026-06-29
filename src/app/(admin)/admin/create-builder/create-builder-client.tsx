"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BuilderAddStepDialog } from "@/components/admin/create-builder/builder-add-step-dialog";
import { BuilderFullscreenPreview } from "@/components/admin/create-builder/builder-fullscreen-preview";
import { BuilderLivePreview } from "@/components/admin/create-builder/builder-live-preview";
import { BuilderSaveBar } from "@/components/admin/create-builder/builder-save-bar";
import { BuilderStepEditor } from "@/components/admin/create-builder/builder-step-editor";
import { BuilderStepsRail } from "@/components/admin/create-builder/builder-steps-rail";
import { useCreationBuilder } from "@/hooks/use-creation-builder";
import type { CreationConfig, CreationOption, CreationStep } from "@/types/character-creation-config";

interface CreateBuilderClientProps {
  initialConfig: CreationConfig;
}

export function CreateBuilderClient({ initialConfig }: CreateBuilderClientProps) {
  const builder = useCreationBuilder(initialConfig);
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  function updateOption(stepId: string, optionId: string, patch: Partial<CreationOption>) {
    builder.updateDraft((prev) => ({
      steps: prev.steps.map((s) =>
        s.id === stepId
          ? {
              ...s,
              options: s.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)),
            }
          : s,
      ),
    }));
  }

  function deleteOption(stepId: string, optionId: string) {
    builder.updateDraft((prev) => ({
      steps: prev.steps.map((s) =>
        s.id === stepId ? { ...s, options: s.options.filter((o) => o.id !== optionId) } : s,
      ),
    }));
  }

  function addOption(stepId: string, group?: string | null) {
    const step = builder.draftConfig.steps.find((s) => s.id === stepId);
    if (!step) return;
    const groupOptions = step.options.filter((o) =>
      group == null ? !o.optionGroup : o.optionGroup === group,
    );
    const newOpt: CreationOption = {
      id: `temp-opt-${Date.now()}`,
      stepId,
      optionKey: `option-${Date.now()}`,
      optionGroup: group ?? null,
      label: "New option",
      imageUrl: null,
      sortOrder: groupOptions.length,
      isEnabled: true,
      metadata: {},
    };
    builder.updateDraft((prev) => ({
      steps: prev.steps.map((s) =>
        s.id === stepId ? { ...s, options: [...s.options, newOpt] } : s,
      ),
    }));
  }

  function reorderOptions(stepId: string, orderedIds: string[], group?: string | null) {
    builder.updateDraft((prev) => ({
      steps: prev.steps.map((s) => {
        if (s.id !== stepId) return s;
        const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
        return {
          ...s,
          options: s.options.map((o) => {
            const inGroup = group == null ? !o.optionGroup : o.optionGroup === group;
            if (!inGroup) return o;
            return { ...o, sortOrder: orderMap.get(o.id) ?? o.sortOrder };
          }),
        };
      }),
    }));
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      await builder.publish();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  const selectedStep = builder.selectedStep;

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <div className="border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Character Creation Builder</h1>
        <p className="text-sm text-muted-foreground">
          Manage the user creation wizard with live preview. Publish when ready.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_1fr]">
        <div className="flex min-h-0 flex-col border-r">
          <div className="min-h-0 flex-1">
            <BuilderStepsRail
              config={builder.draftConfig}
              selectedStepId={builder.selectedStepId}
              onSelectStep={builder.setSelectedStepId}
              onReorder={builder.reorderSteps}
              onUpdateStep={(id, patch) => builder.updateStep(id, patch)}
              onDuplicateStep={builder.duplicateStep}
              onDeleteStep={builder.deleteStep}
              onAddStep={() => setAddStepOpen(true)}
            />
          </div>
          <div className="max-h-[45%] min-h-[200px]">
            <BuilderStepEditor
              step={selectedStep}
              onUpdateStep={(patch) => {
                if (selectedStep) builder.updateStep(selectedStep.id, patch);
              }}
              onUpdateOption={(optionId, patch) => {
                if (selectedStep) updateOption(selectedStep.id, optionId, patch);
              }}
              onDeleteOption={(optionId) => {
                if (selectedStep) deleteOption(selectedStep.id, optionId);
              }}
              onAddOption={(group) => {
                if (selectedStep) addOption(selectedStep.id, group);
              }}
              onReorderOptions={(orderedIds, group) => {
                if (selectedStep) reorderOptions(selectedStep.id, orderedIds, group);
              }}
            />
          </div>
        </div>

        <div className="min-h-[400px] p-3 lg:min-h-0">
          <BuilderLivePreview
            config={builder.draftConfig}
            device={builder.device}
            onDeviceChange={builder.setDevice}
            previewStep={builder.previewStep}
            onPreviewStepChange={builder.setPreviewStep}
            onRestart={builder.resetPreview}
            onFullscreen={() => setFullscreenOpen(true)}
          />
        </div>
      </div>

      <BuilderSaveBar
        isDirty={builder.isDirty}
        publishing={publishing}
        onSaveDraft={builder.saveDraft}
        onPublish={() => void handlePublish()}
      />

      <BuilderAddStepDialog
        open={addStepOpen}
        onOpenChange={setAddStepOpen}
        onAdd={({ stepKey, label, stepType }) => {
          const id = `temp-step-${Date.now()}`;
          const newStep: CreationStep = {
            id,
            stepKey,
            label,
            description: null,
            stepType,
            sortOrder: builder.draftConfig.steps.length,
            isEnabled: true,
            isRequired: true,
            config: stepType === "dual_select" ? { groups: ["groupA", "groupB"] } : {},
            options: [],
          };
          builder.addStep(newStep);
        }}
      />

      <BuilderFullscreenPreview
        open={fullscreenOpen}
        onOpenChange={setFullscreenOpen}
        config={builder.draftConfig}
      />

      <Dialog open={builder.showRestorePrompt} onOpenChange={() => builder.discardStoredDraft()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore saved draft?</DialogTitle>
            <DialogDescription>
              A local draft was found that differs from the published wizard. Restore it or continue
              with the published version.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={builder.discardStoredDraft}>
              Use published
            </Button>
            <Button type="button" onClick={builder.restoreDraft}>
              Restore draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
