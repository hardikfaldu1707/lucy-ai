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
        "flex items-center gap-2 rounded-lg border bg-card p-2",
        isDragging && "opacity-60 shadow-lg",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
        {option.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={option.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
          </div>
        )}
      </div>

      <Input
        value={option.label}
        onChange={(e) => onChange({ label: e.target.value })}
        className="h-8 flex-1 text-sm"
        aria-label="Option label"
      />

      <Switch
        checked={option.isEnabled}
        onCheckedChange={(v) => onChange({ isEnabled: v })}
        aria-label="Enable option"
      />

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

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
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
          className="h-8 w-8 shrink-0 text-muted-foreground"
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
        className="h-8 w-8 shrink-0 text-destructive"
        onClick={onDelete}
        aria-label="Delete option"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
