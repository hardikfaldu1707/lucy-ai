"use client";

import { useRef, useState } from "react";
import { GripVertical, ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { isAllowedImageFile, resolveCreationConfigUploadOptions, uploadToR2 } from "@/lib/upload-client";
import { IMAGE_MAX_UPLOAD_BYTES } from "@/lib/storage/upload-limits";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CreationOption } from "@/types/character-creation-config";

interface BuilderOptionRowProps {
  option: CreationOption;
  onChange: (patch: Partial<CreationOption>) => void;
  onDelete: () => void;
}

export function BuilderOptionRow({ option, onChange, onDelete }: BuilderOptionRowProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: option.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function handleUpload(file: File) {
    if (!isAllowedImageFile(file)) {
      toast.error("Please upload JPEG, PNG, WebP, or GIF");
      return;
    }
    if (file.size > IMAGE_MAX_UPLOAD_BYTES) {
      toast.error("Image must be less than 10MB");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadToR2(
        file,
        resolveCreationConfigUploadOptions(option.optionKey),
      );
      onChange({ imageUrl: url });
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-border-hover",
        isDragging && "opacity-60 shadow-xl border-primary bg-accent/20",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground/60 hover:text-foreground transition-colors"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30">
        {option.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={option.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/45 bg-muted/20">
            <ImageIcon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="flex flex-1 gap-3 min-w-0">
        <div className="flex-[2] min-w-0 space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground/80 tracking-wider uppercase block">Display Name</span>
          <Input
            value={option.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="h-8 w-full text-sm bg-background/50 border-border/60"
            placeholder="e.g. Blonde hair"
            aria-label="Option label"
          />
        </div>
        <div className="flex-[1.2] min-w-0 space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground/80 tracking-wider uppercase block">Match Key</span>
          <Input
            value={option.optionKey}
            onChange={(e) => onChange({ optionKey: e.target.value })}
            className="h-8 w-full text-xs font-mono bg-muted/40 border-border/60"
            placeholder="e.g. hair_blonde"
            aria-label="Option key"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 shrink-0 px-2 border-l border-r border-border/40">
        <span className="text-[9px] font-bold text-muted-foreground/80 tracking-wider uppercase block">Active</span>
        <Switch
          checked={option.isEnabled}
          onCheckedChange={(v) => onChange({ isEnabled: v })}
          aria-label="Enable option"
        />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUpload(file);
          e.target.value = "";
        }}
      />

      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          aria-label="Upload image"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        </Button>

        {option.imageUrl && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onChange({ imageUrl: null })}
            aria-label="Remove image"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={onDelete}
          aria-label="Delete option"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
