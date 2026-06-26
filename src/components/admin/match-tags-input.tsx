"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { parseTagsInput } from "@/types/gallery";

interface MatchTagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function MatchTagsInput({
  value,
  onChange,
  label = "Match tags",
  placeholder = "Type a tag and press Enter",
  className,
}: MatchTagsInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = (raw: string) => {
    const next = parseTagsInput(raw);
    if (!next.length) return;
    const merged = [...value];
    for (const tag of next) {
      if (!merged.includes(tag)) merged.push(tag);
    }
    onChange(merged);
    setDraft("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-1.5 rounded-lg border bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring">
        <div className="min-w-0 flex-1">
          {value.length > 0 && (
            <div className="mb-1.5 flex flex-wrap gap-1">
              {value.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-xs font-normal">
                  {tag}
                  <button
                    type="button"
                    className="rounded-sm p-0.5 hover:bg-muted"
                    aria-label={`Remove tag ${tag}`}
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => {
              if (draft.trim()) addTag(draft);
            }}
            placeholder={placeholder}
            className="h-8 border-0 px-1 shadow-none focus-visible:ring-0"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 shrink-0 gap-1 px-2 text-xs"
          disabled={!draft.trim()}
          onClick={() => addTag(draft)}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Type a tag, then press Add or Enter. Users get this file when their chat message includes a tag.
      </p>
    </div>
  );
}
