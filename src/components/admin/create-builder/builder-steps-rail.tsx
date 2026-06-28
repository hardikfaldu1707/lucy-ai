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
import { ScrollArea } from "@/components/ui/scroll-area";
import { BuilderStepRow } from "./builder-step-row";
import type { CreationConfig, CreationStep } from "@/types/character-creation-config";

interface BuilderStepsRailProps {
  config: CreationConfig;
  selectedStepId: string | null;
  onSelectStep: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onUpdateStep: (stepId: string, patch: Partial<CreationStep>) => void;
  onDuplicateStep: (stepId: string) => void;
  onDeleteStep: (stepId: string) => void;
  onAddStep: () => void;
}

export function BuilderStepsRail({
  config,
  selectedStepId,
  onSelectStep,
  onReorder,
  onUpdateStep,
  onDuplicateStep,
  onDeleteStep,
  onAddStep,
}: BuilderStepsRailProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sortedSteps = [...config.steps].sort((a, b) => a.sortOrder - b.sortOrder);
  const stepIds = sortedSteps.map((s) => s.id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = stepIds.indexOf(String(active.id));
    const newIndex = stepIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = [...stepIds];
    const [removed] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, removed);
    onReorder(next);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-3 py-2">
        <h2 className="text-sm font-semibold">Steps</h2>
        <p className="text-xs text-muted-foreground">Drag to reorder the wizard flow</p>
      </div>
      <ScrollArea className="flex-1 px-2 py-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sortedSteps.map((step) => (
                <BuilderStepRow
                  key={step.id}
                  step={step}
                  selected={selectedStepId === step.id}
                  onSelect={() => onSelectStep(step.id)}
                  onToggleEnabled={(enabled) => onUpdateStep(step.id, { isEnabled: enabled })}
                  onDuplicate={() => onDuplicateStep(step.id)}
                  onDelete={() => onDeleteStep(step.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </ScrollArea>
      <div className="border-t p-2">
        <Button type="button" variant="outline" className="w-full" onClick={onAddStep}>
          <Plus className="mr-2 h-4 w-4" />
          Add Step
        </Button>
      </div>
    </div>
  );
}
