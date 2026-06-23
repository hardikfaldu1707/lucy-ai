"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadToR2, isAllowedImageFile } from "@/lib/upload-client";
import { toast } from "sonner";
import { GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CharacterGalleryPickerProps {
  value: string[];
  onChange: (urls: string[]) => void;
  characterId?: string;
  maxPhotos?: number;
}

export function CharacterGalleryPicker({
  value,
  onChange,
  characterId,
  maxPhotos = 12,
}: CharacterGalleryPickerProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = maxPhotos - value.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        if (!isAllowedImageFile(file)) {
          toast.error(`${file.name}: unsupported format`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name}: max 10MB`);
          continue;
        }
        const url = await uploadToR2(file, {
          scope: "character",
          characterId,
        });
        uploaded.push(url);
      }
      if (uploaded.length) {
        onChange([...value, ...uploaded]);
        toast.success(`${uploaded.length} photo(s) added`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Photo gallery ({value.length}/{maxPhotos})</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          disabled={uploading || value.length >= maxPhotos}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Plus className="h-3.5 w-3.5" aria-hidden />
          )}
          Add photos
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          aria-label="Upload gallery photos"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {value.length === 0 ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex min-h-[120px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-colors",
            "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          )}
        >
          <Plus className="mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="text-xs font-medium">Upload profile photos</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Portrait PNG, JPG, WEBP up to 10MB each</p>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-lg border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-end justify-between gap-0.5 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <div className="flex gap-0.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6"
                    aria-label="Move earlier"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <GripVertical className="h-3 w-3" aria-hidden />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Remove photo"
                  onClick={() => removeAt(index)}
                >
                  <Trash2 className="h-3 w-3" aria-hidden />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
