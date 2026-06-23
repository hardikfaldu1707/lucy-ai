"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface SuggestedQuestionsEditorProps {
  value: string[];
  onChange: (questions: string[]) => void;
  max?: number;
}

export function SuggestedQuestionsEditor({
  value,
  onChange,
  max = 6,
}: SuggestedQuestionsEditorProps) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const q = draft.trim();
    if (!q) return;
    if (value.length >= max) return;
    if (value.includes(q)) {
      setDraft("");
      return;
    }
    onChange([...value, q]);
    setDraft("");
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label>Chat starter questions ({value.length}/{max})</Label>
      <p className="text-[10px] text-muted-foreground">
        Shown as clickable chips above the message box when the chat is empty.
      </p>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. What are you up to tonight?"
          maxLength={120}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Add question"
          disabled={!draft.trim() || value.length >= max}
          onClick={add}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((q, i) => (
            <li
              key={`${q}-${i}`}
              className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
            >
              <span className="flex-1 truncate">{q}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-destructive"
                aria-label="Remove question"
                onClick={() => removeAt(i)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
