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
  const [uploadingRealistic, setUploadingRealistic] = useState(false);
  const [uploadingAnime, setUploadingAnime] = useState(false);
  const fileRealisticRef = useRef<HTMLInputElement>(null);
  const fileAnimeRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: option.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function handleUploadRealistic(file: File) {
    if (!isAllowedImageFile(file)) {
      toast.error("Please upload JPEG, PNG, WebP, or GIF");
      return;
    }
    if (file.size > IMAGE_MAX_UPLOAD_BYTES) {
      toast.error("Image must be less than 10MB");
      return;
    }
    setUploadingRealistic(true);
    try {
      const url = await uploadToR2(
        file,
        resolveCreationConfigUploadOptions(option.optionKey),
      );
      onChange({ imageUrl: url });
      toast.success("Realistic image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingRealistic(false);
    }
  }

  async function handleUploadAnime(file: File) {
    if (!isAllowedImageFile(file)) {
      toast.error("Please upload JPEG, PNG, WebP, or GIF");
      return;
    }
    if (file.size > IMAGE_MAX_UPLOAD_BYTES) {
      toast.error("Image must be less than 10MB");
      return;
    }
    setUploadingAnime(true);
    try {
      const url = await uploadToR2(
        file,
        resolveCreationConfigUploadOptions(option.optionKey + "_anime"),
      );
      onChange({
        metadata: {
          ...option.metadata,
          imageUrlAnime: url,
        },
      });
      toast.success("Anime image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingAnime(false);
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

      {/* Realistic Thumbnail Container */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <span className="text-[9px] font-bold text-muted-foreground/80 tracking-wider uppercase">Realistic</span>
        <div className="group/img relative h-12 w-12 overflow-hidden rounded-lg border border-border bg-muted/30">
          {option.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={option.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/45 bg-muted/20">
              <ImageIcon className="h-5 w-5" />
            </div>
          )}
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1">
            <button
              type="button"
              disabled={uploadingRealistic}
              onClick={() => fileRealisticRef.current?.click()}
              className="p-1 rounded bg-background/80 hover:bg-background text-foreground transition-colors"
              title="Upload Realistic"
            >
              {uploadingRealistic ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
            </button>
            {option.imageUrl && (
              <button
                type="button"
                onClick={() => onChange({ imageUrl: null })}
                className="p-1 rounded bg-background/80 hover:bg-destructive hover:text-destructive-foreground text-foreground transition-colors"
                title="Remove Realistic"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Anime Thumbnail Container */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <span className="text-[9px] font-bold text-muted-foreground/80 tracking-wider uppercase">Anime</span>
        <div className="group/img relative h-12 w-12 overflow-hidden rounded-lg border border-border bg-muted/30">
          {option.metadata?.imageUrlAnime ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={option.metadata.imageUrlAnime} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/45 bg-muted/20">
              <ImageIcon className="h-5 w-5" />
            </div>
          )}
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1">
            <button
              type="button"
              disabled={uploadingAnime}
              onClick={() => fileAnimeRef.current?.click()}
              className="p-1 rounded bg-background/80 hover:bg-background text-foreground transition-colors"
              title="Upload Anime"
            >
              {uploadingAnime ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
            </button>
            {option.metadata?.imageUrlAnime && (
              <button
                type="button"
                onClick={() => {
                  const updatedMetadata = { ...option.metadata };
                  delete updatedMetadata.imageUrlAnime;
                  onChange({ metadata: updatedMetadata });
                }}
                className="p-1 rounded bg-background/80 hover:bg-destructive hover:text-destructive-foreground text-foreground transition-colors"
                title="Remove Anime"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
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
        ref={fileRealisticRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUploadRealistic(file);
          e.target.value = "";
        }}
      />

      <input
        ref={fileAnimeRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUploadAnime(file);
          e.target.value = "";
        }}
      />

      <div className="flex items-center gap-1 shrink-0">
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
