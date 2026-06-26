"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

export interface SuggestedQuestionsGenerateContext {
  name: string;
  tagline?: string;
  description?: string;
  personality?: string[];
  tags?: string[];
  category?: string;
  style?: string;
  age?: number;
}

interface SuggestedQuestionsEditorProps {
  value: string[];
  onChange: (questions: string[]) => void;
  max?: number;
  generateContext?: SuggestedQuestionsGenerateContext;
}

export function SuggestedQuestionsEditor({
  value,
  onChange,
  max = 6,
  generateContext,
}: SuggestedQuestionsEditorProps) {
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);

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

  const handleGenerate = async () => {
    if (!generateContext?.name.trim()) {
      toast.error("Add a character name first");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/admin/characters/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generateContext),
      });
      const data = (await res.json().catch(() => ({}))) as {
        questions?: string[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Generation failed");
      }
      const questions = (data.questions ?? []).slice(0, max);
      if (!questions.length) {
        throw new Error("No questions returned");
      }
      onChange(questions);
      toast.success(`Generated ${questions.length} starter questions`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate questions");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Chat starter questions ({value.length}/{max})</Label>
        {generateContext && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={generating}
            onClick={handleGenerate}
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Generate with AI
          </Button>
        )}
      </div>
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
