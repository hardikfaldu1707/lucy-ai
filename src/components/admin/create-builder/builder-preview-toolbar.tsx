"use client";

import { ChevronLeft, ChevronRight, Monitor, RotateCcw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BuilderPreviewToolbarProps {
  device: "desktop" | "mobile";
  onDeviceChange: (device: "desktop" | "mobile") => void;
  previewStep: number;
  stepCount: number;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
  onFullscreen?: () => void;
}

export function BuilderPreviewToolbar({
  device,
  onDeviceChange,
  previewStep,
  stepCount,
  onPrev,
  onNext,
  onRestart,
  onFullscreen,
}: BuilderPreviewToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant={device === "desktop" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onDeviceChange("desktop")}
        >
          <Monitor className="mr-1.5 h-3.5 w-3.5" />
          Desktop
        </Button>
        <Button
          type="button"
          variant={device === "mobile" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onDeviceChange("mobile")}
        >
          <Smartphone className="mr-1.5 h-3.5 w-3.5" />
          Mobile
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={onPrev} disabled={previewStep <= 0}>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className={cn("px-2 text-xs text-muted-foreground")}>
          {previewStep + 1} / {stepCount}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={previewStep >= stepCount - 1}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onRestart}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Restart
        </Button>
      </div>

      {onFullscreen && (
        <Button type="button" variant="outline" size="sm" onClick={onFullscreen}>
          Preview As User
        </Button>
      )}
    </div>
  );
}
