"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BuilderSaveBarProps {
  isDirty: boolean;
  publishing: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export function BuilderSaveBar({ isDirty, publishing, onSaveDraft, onPublish }: BuilderSaveBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-t bg-background px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isDirty && (
          <>
            <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
            Unsaved changes
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={onSaveDraft}>
          Save Draft
        </Button>
        <Button
          type="button"
          onClick={onPublish}
          disabled={!isDirty || publishing}
          className={cn(isDirty && "bg-primary")}
        >
          {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Publish Changes
        </Button>
      </div>
    </div>
  );
}
