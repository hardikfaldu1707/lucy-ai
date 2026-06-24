"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaTypePicker } from "@/components/shared/media-type-picker";
import {
  uploadGalleryMediaToR2,
  resolveCharacterUploadOptions,
  isAllowedImageFile,
  isAllowedVideoFile,
} from "@/lib/upload-client";
import { toast } from "sonner";
import { GripVertical, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatTagsInput,
  parseTagsInput,
  type CharacterGalleryItem,
  type GalleryMediaType,
} from "@/types/gallery";

interface CharacterGalleryPickerProps {
  value: CharacterGalleryItem[];
  onChange: (items: CharacterGalleryItem[]) => void;
  characterId?: string;
  maxItems?: number;
}

export function CharacterGalleryPicker({
  value,
  onChange,
  characterId,
  maxItems = 12,
}: CharacterGalleryPickerProps) {
  const [uploading, setUploading] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [pendingType, setPendingType] = useState<GalleryMediaType | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [newItemTags, setNewItemTags] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const atLimit = value.length >= maxItems;
  const uploadOptions = resolveCharacterUploadOptions(characterId);

  const openTypePicker = () => {
    if (atLimit) {
      toast.error(`Maximum ${maxItems} gallery items allowed`);
      return;
    }
    setShowTypePicker(true);
    setPendingType(null);
  };

  const handleTypeSelect = (type: GalleryMediaType) => {
    setShowTypePicker(false);
    setPendingType(type);
    setNewItemTags("");
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !pendingType) return;
    const remaining = maxItems - value.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxItems} gallery items allowed`);
      return;
    }

    const type = pendingType;
    const toUpload = Array.from(files).slice(0, remaining);
    const tags = parseTagsInput(newItemTags);

    setUploading(true);
    try {
      const uploaded: CharacterGalleryItem[] = [];
      for (const file of toUpload) {
        const allowed = type === "video" ? isAllowedVideoFile(file) : isAllowedImageFile(file);
        if (!allowed) {
          toast.error(`${file.name}: unsupported format for ${type}`);
          continue;
        }
        const maxSize = type === "video" ? 15 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error(`${file.name}: file too large`);
          continue;
        }
        const url = await uploadGalleryMediaToR2(file, uploadOptions);
        uploaded.push({ url, type, tags: uploaded.length === 0 ? tags : [] });
      }
      if (uploaded.length) {
        onChange([...value, ...uploaded]);
        toast.success(`${uploaded.length} item(s) added`);
        setPendingType(null);
        setNewItemTags("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!pendingType) {
      openTypePicker();
      return;
    }
    void handleFiles(e.dataTransfer.files);
  };

  const updateItem = (index: number, patch: Partial<CharacterGalleryItem>) => {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
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

  const accept =
    pendingType === "video"
      ? "video/mp4,video/webm,.mp4,.webm"
      : "image/*";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Chat media library ({value.length}/{maxItems})</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          disabled={uploading || atLimit}
          onClick={openTypePicker}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Plus className="h-3.5 w-3.5" aria-hidden />
          )}
          Add media
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Users tap + in chat, pick Photo or Video, and type a prompt. Match tags here control
        which file is served (e.g. red dress, selfie, bedroom).
      </p>

      {!characterId && (
        <p className="text-xs text-amber-600 dark:text-amber-500">
          New character: uploads work before save. Save the character to link files to its folder.
        </p>
      )}

      {showTypePicker && (
        <div className="rounded-xl border bg-muted/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Choose media type</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Close"
              onClick={() => setShowTypePicker(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <MediaTypePicker
            title="Add chat media"
            subtitle="Same Photo / Video flow users see in chat"
            variant="admin"
            disabled={uploading}
            onSelect={handleTypeSelect}
          />
        </div>
      )}

      {pendingType && !uploading && (
        <div className="space-y-2 rounded-xl border bg-card p-3">
          <Label className="text-xs text-muted-foreground">
            Match tags for this {pendingType} (optional)
          </Label>
          <Input
            value={newItemTags}
            onChange={(e) => setNewItemTags(e.target.value)}
            placeholder="red dress, selfie, bedroom"
            className="h-8 text-sm"
          />
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (pendingType) fileInputRef.current?.click();
          else openTypePicker();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (pendingType) fileInputRef.current?.click();
            else openTypePicker();
          }
        }}
        className={cn(
          "flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={pendingType === "image"}
          className="hidden"
          aria-label={pendingType ? `Upload ${pendingType}` : "Upload gallery media"}
          onChange={(e) => void handleFiles(e.target.files)}
        />
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
        ) : (
          <>
            <Upload className="mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
            <p className="text-xs font-medium">
              {pendingType
                ? `Drag & drop or click to upload ${pendingType}`
                : "Tap Add media or drop files here"}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Images up to 10MB, videos up to 15MB
            </p>
          </>
        )}
      </div>

      {value.length > 0 && (
        <div className="space-y-3">
          {value.map((item, index) => (
            <div
              key={`${item.url}-${index}`}
              className="flex gap-3 rounded-xl border bg-muted/20 p-3"
            >
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                {item.type === "video" ? (
                  <video
                    src={item.url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={`Gallery ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={item.type}
                    onValueChange={(next) =>
                      updateItem(index, { type: next as GalleryMediaType })
                    }
                  >
                    <SelectTrigger className="h-8 w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="ml-auto flex gap-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Move earlier"
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    >
                      <GripVertical className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Remove item"
                      onClick={() => removeAt(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Match tags</Label>
                  <Input
                    value={formatTagsInput(item.tags)}
                    onChange={(e) =>
                      updateItem(index, { tags: parseTagsInput(e.target.value) })
                    }
                    placeholder="red dress, selfie, bedroom"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
