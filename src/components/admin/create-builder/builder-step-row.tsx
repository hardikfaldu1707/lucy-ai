"use client";

import { CheckCircle2, Circle, GripVertical, MoreHorizontal } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { CreationStep } from "@/types/character-creation-config";

interface BuilderStepRowProps {
  step: CreationStep;
  selected: boolean;
  onSelect: () => void;
  onToggleEnabled: (enabled: boolean) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function BuilderStepRow({
  step,
  selected,
  onSelect,
  onToggleEnabled,
  onDuplicate,
  onDelete,
}: BuilderStepRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const enabledOptions = step.options.filter((o) => o.isEnabled).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-1 rounded-lg border p-2 transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border bg-card",
        isDragging && "opacity-60 shadow-lg",
        !step.isEnabled && "opacity-60",
      )}
    >
      <button
        type="button"
        className="mt-1 cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder step"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2 min-w-0">
          {step.isEnabled ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
          ) : (
            <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          )}
          <span className="truncate font-medium">{step.label}</span>
          {step.config?.styleFilter && step.config.styleFilter !== "all" && (
            <span className={cn(
              "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0",
              step.config.styleFilter === "realistic"
                ? "bg-blue-500/10 text-blue-500 border border-blue-500/25"
                : "bg-purple-500/10 text-purple-500 border border-purple-500/25"
            )}>
              {step.config.styleFilter}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {step.isEnabled ? (
            <>
              Active · {enabledOptions} option{enabledOptions !== 1 ? "s" : ""}
              {step.isRequired ? " · Required" : ""}
            </>
          ) : (
            "Disabled"
          )}
        </p>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onToggleEnabled(!step.isEnabled)}>
            {step.isEnabled ? "Disable" : "Enable"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>Duplicate</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
