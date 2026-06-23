"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AiModelChoice } from "@/hooks/use-ai-models";

export const DEFAULT_MODEL_VALUE = "__default__";

interface CharacterModelSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  models: AiModelChoice[];
  defaultModel: string;
  loading?: boolean;
  showEnvDefault?: boolean;
}

export function CharacterModelSelect({
  id = "aiModel",
  value,
  onChange,
  models,
  defaultModel,
  loading,
  showEnvDefault = true,
}: CharacterModelSelectProps) {
  const defaultLabel =
    models.find((m) => m.id === defaultModel)?.label ?? defaultModel;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>AI model</Label>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={loading ? "Loading models…" : "Select a model"} />
        </SelectTrigger>
        <SelectContent>
          {showEnvDefault && (
            <SelectItem value={DEFAULT_MODEL_VALUE}>
              Default ({defaultLabel})
            </SelectItem>
          )}
          {models.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.label} · {m.provider}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
