"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreationStepType } from "@/types/character-creation-config";

interface BuilderAddStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: { stepKey: string; label: string; stepType: CreationStepType }) => void;
}

const STEP_TYPES: { value: CreationStepType; label: string }[] = [
  { value: "single_select", label: "Single select" },
  { value: "dual_select", label: "Dual select" },
  { value: "identity", label: "Identity fields" },
  { value: "multi_select", label: "Multi select" },
  { value: "voice", label: "Voice" },
  { value: "review", label: "Review & bond" },
];

export function BuilderAddStepDialog({ open, onOpenChange, onAdd }: BuilderAddStepDialogProps) {
  const [stepKey, setStepKey] = useState("");
  const [label, setLabel] = useState("");
  const [stepType, setStepType] = useState<CreationStepType>("single_select");

  function handleAdd() {
    if (!stepKey.trim() || !label.trim()) return;
    onAdd({ stepKey: stepKey.trim(), label: label.trim(), stepType });
    setStepKey("");
    setLabel("");
    setStepType("single_select");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add wizard step</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="new-step-key">Step key (unique id)</Label>
            <Input
              id="new-step-key"
              value={stepKey}
              onChange={(e) => setStepKey(e.target.value)}
              placeholder="e.g. hobbies"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-step-label">Label</Label>
            <Input
              id="new-step-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Hobbies"
            />
          </div>
          <div className="space-y-2">
            <Label>Step type</Label>
            <Select value={stepType} onValueChange={(v) => setStepType(v as CreationStepType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STEP_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleAdd} disabled={!stepKey.trim() || !label.trim()}>
            Add step
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
