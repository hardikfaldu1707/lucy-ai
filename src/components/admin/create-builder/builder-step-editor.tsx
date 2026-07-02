"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { BuilderOptionRow } from "./builder-option-row";
import type { CreationOption, CreationStep, CreationStepType } from "@/types/character-creation-config";

interface BuilderStepEditorProps {
  step: CreationStep | null;
  onUpdateStep: (patch: Partial<CreationStep>) => void;
  onUpdateOption: (optionId: string, patch: Partial<CreationOption>) => void;
  onDeleteOption: (optionId: string) => void;
  onAddOption: (group?: string | null) => void;
  onReorderOptions: (orderedIds: string[], group?: string | null) => void;
}

const STEP_TYPE_LABELS: Record<CreationStepType, string> = {
  single_select: "Single select",
  dual_select: "Dual select (e.g. hair)",
  identity: "Identity fields",
  multi_select: "Multi select",
  voice: "Voice",
  review: "Review & bond",
};

export function BuilderStepEditor({
  step,
  onUpdateStep,
  onUpdateOption,
  onDeleteOption,
  onAddOption,
  onReorderOptions,
}: BuilderStepEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!step) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
        Select a step to edit its settings and options
      </div>
    );
  }

  const hasOptions = ["single_select", "dual_select", "multi_select", "voice", "review"].includes(
    step.stepType,
  );

  function optionsForGroup(group?: string | null) {
    return [...step!.options]
      .filter((o) => (group == null ? !o.optionGroup : o.optionGroup === group))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function handleOptionDragEnd(group: string | null | undefined, event: DragEndEvent) {
    const items = optionsForGroup(group);
    const ids = items.map((o) => o.id);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = [...ids];
    const [removed] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, removed);
    onReorderOptions(next, group);
  }

  function renderOptionList(group?: string | null) {
    const items = optionsForGroup(group);
    const ids = items.map((o) => o.id);

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(e) => handleOptionDragEnd(group, e)}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((opt) => (
              <BuilderOptionRow
                key={opt.id}
                option={opt}
                onChange={(patch) => onUpdateOption(opt.id, patch)}
                onDelete={() => onDeleteOption(opt.id)}
              />
            ))}
          </div>
        </SortableContext>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={() => onAddOption(group)}
        >
          <Plus className="mr-2 h-3.5 w-3.5" />
          Add Option
        </Button>
      </DndContext>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-3 py-2 bg-muted/5">
        <h2 className="text-sm font-semibold">Step Editor — {step.label}</h2>
      </div>
      <Tabs defaultValue="general" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-3 mt-2 grid w-auto grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="options" disabled={!hasOptions}>
            Options
          </TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="step-label">Label</Label>
              <Input
                id="step-label"
                value={step.label}
                onChange={(e) => onUpdateStep({ label: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="step-desc">Description</Label>
              <Textarea
                id="step-desc"
                value={step.description ?? ""}
                onChange={(e) => onUpdateStep({ description: e.target.value || null })}
                rows={2}
                placeholder="Optional helper text shown in preview"
              />
            </div>
            <div className="space-y-2">
              <Label>Step type</Label>
              <Input value={STEP_TYPE_LABELS[step.stepType]} readOnly className="bg-muted" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="step-required">Required</Label>
              <Switch
                id="step-required"
                checked={step.isRequired}
                onCheckedChange={(v) => onUpdateStep({ isRequired: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="step-enabled">Enabled</Label>
              <Switch
                id="step-enabled"
                checked={step.isEnabled}
                onCheckedChange={(v) => onUpdateStep({ isEnabled: v })}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="options" className="flex-1 overflow-y-auto px-3 pb-3">
          {step.stepType === "dual_select" ? (
            <Tabs defaultValue="hairStyle" className="pt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="hairStyle">Hair style</TabsTrigger>
                <TabsTrigger value="hairColor">Hair color</TabsTrigger>
              </TabsList>
              <TabsContent value="hairStyle" className="mt-2">
                {renderOptionList("hairStyle")}
              </TabsContent>
              <TabsContent value="hairColor" className="mt-2">
                {renderOptionList("hairColor")}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="pt-2">{renderOptionList(null)}</div>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="space-y-4 pt-2">
            {step.stepType === "identity" && (
              <>
                <div className="space-y-2">
                  <Label>Min age</Label>
                  <Input
                    type="number"
                    value={step.config.minAge ?? 18}
                    onChange={(e) =>
                      onUpdateStep({ config: { ...step.config, minAge: Number(e.target.value) } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name field label</Label>
                  <Input
                    value={step.config.nameLabel ?? "Name"}
                    onChange={(e) =>
                      onUpdateStep({ config: { ...step.config, nameLabel: e.target.value } })
                    }
                  />
                </div>
              </>
            )}
            {step.stepType === "multi_select" && (
              <div className="space-y-2">
                <Label>Max selections</Label>
                <Input
                  type="number"
                  min={1}
                  value={step.config.maxSelections ?? 5}
                  onChange={(e) =>
                    onUpdateStep({
                      config: { ...step.config, maxSelections: Number(e.target.value) },
                    })
                  }
                />
              </div>
            )}
            {step.stepType === "voice" &&
              optionsForGroup(null).map((opt) => (
                <div key={opt.id} className="space-y-2 rounded-lg border p-3">
                  <p className="text-sm font-medium">{opt.label}</p>
                  <Input
                    placeholder="TTS voice id (alloy, nova, …)"
                    value={opt.metadata.voiceId ?? ""}
                    onChange={(e) =>
                      onUpdateOption(opt.id, {
                        metadata: { ...opt.metadata, voiceId: e.target.value },
                      })
                    }
                  />
                  <Textarea
                    placeholder="Description"
                    value={opt.metadata.description ?? ""}
                    onChange={(e) =>
                      onUpdateOption(opt.id, {
                        metadata: { ...opt.metadata, description: e.target.value },
                      })
                    }
                    rows={2}
                  />
                </div>
              ))}
            {(step.stepType === "multi_select" || step.stepType === "review") &&
              optionsForGroup(null).map((opt) => (
                <div key={opt.id} className="space-y-2 rounded-lg border p-3">
                  <p className="text-sm font-medium">{opt.label}</p>
                  <Textarea
                    placeholder="Prompt behavior"
                    value={opt.metadata.behavior ?? opt.metadata.role ?? ""}
                    onChange={(e) =>
                      onUpdateOption(opt.id, {
                        metadata: {
                          ...opt.metadata,
                          ...(step.stepType === "review"
                            ? { role: e.target.value }
                            : { behavior: e.target.value }),
                        },
                      })
                    }
                    rows={2}
                  />
                  <Input
                    placeholder="Speech hint / dynamic"
                    value={opt.metadata.speechHint ?? opt.metadata.dynamic ?? ""}
                    onChange={(e) =>
                      onUpdateOption(opt.id, {
                        metadata: {
                          ...opt.metadata,
                          ...(step.stepType === "review"
                            ? { dynamic: e.target.value }
                            : { speechHint: e.target.value }),
                        },
                      })
                    }
                  />
                </div>
              ))}
            {!["identity", "multi_select", "voice", "review"].includes(step.stepType) && (
              <p className="text-sm text-muted-foreground">
                No advanced settings for this step type. Use Options tab for images and labels.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
