"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { captureVideoPosterBlob } from "@/lib/image/video-poster";
import {
  isAllowedImageFile,
  isAllowedVideoFile,
  resolveCharacterUploadOptions,
  uploadToR2,
  uploadVideoToR2,
} from "@/lib/upload-client";
import {
  IMAGE_MAX_UPLOAD_BYTES,
  VIDEO_MAX_UPLOAD_BYTES,
} from "@/lib/storage/upload-limits";
import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import { toast } from "sonner";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GalleryMediaType } from "@/types/gallery";

export interface ProfileMediaState {
  avatarUrl: string;
  previewVideoUrl: string;
  cardDisplayMode: "image" | "video";
}

interface CharacterProfileMediaPickerProps {
  value: ProfileMediaState;
  onChange: (patch: Partial<ProfileMediaState>) => void;
  characterId?: string;
  previewSeed?: string;
}

export function CharacterProfileMediaPicker({
  value,
  onChange,
  characterId,
  previewSeed = "preview-seed",
}: CharacterProfileMediaPickerProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadOptions = resolveCharacterUploadOptions(characterId);
  const showVideo =
    value.cardDisplayMode === "video" && Boolean(value.previewVideoUrl.trim());
  const previewImage = resolveCharacterImageUrl(value.avatarUrl, previewSeed);

  const handlePhotoFile = async (file: File) => {
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
      const url = await uploadToR2(file, uploadOptions);
      onChange({
        avatarUrl: url,
        previewVideoUrl: "",
        cardDisplayMode: "image",
      });
      toast.success("Profile photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleVideoFile = async (file: File) => {
    if (!isAllowedVideoFile(file)) {
      toast.error("Please upload MP4 or WebM video");
      return;
    }
    if (file.size > VIDEO_MAX_UPLOAD_BYTES) {
      toast.error("Video must be less than 50MB");
      return;
    }

    setUploading(true);
    try {
      const videoUrl = await uploadVideoToR2(file, uploadOptions);
      let posterUrl = value.avatarUrl;
      try {
        const posterBlob = await captureVideoPosterBlob(file);
        const posterFile = new File([posterBlob], "poster.jpg", { type: "image/jpeg" });
        posterUrl = await uploadToR2(posterFile, uploadOptions);
      } catch {
        if (!posterUrl.trim()) {
          toast.error("Video uploaded but poster capture failed — add a photo URL manually");
        }
      }
      onChange({
        avatarUrl: posterUrl,
        previewVideoUrl: videoUrl,
        cardDisplayMode: "video",
      });
      toast.success("Profile video uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFile = async (file: File, type: GalleryMediaType) => {
    if (type === "video") await handleVideoFile(file);
    else await handlePhotoFile(file);
  };

  const resolveFileType = (file: File): GalleryMediaType | null => {
    if (isAllowedVideoFile(file)) return "video";
    if (isAllowedImageFile(file)) return "image";
    return null;
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const type = resolveFileType(file);
    if (!type) {
      toast.error("Please upload JPEG, PNG, WebP, GIF, MP4, or WebM");
      return;
    }

    void handleFile(file, type);
  };

  const clearMedia = () => {
    onChange({
      avatarUrl: "",
      previewVideoUrl: "",
      cardDisplayMode: "image",
    });
  };

  const accept = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex shrink-0 flex-col">
          <div className="relative flex aspect-[3/4] w-32 items-center justify-center overflow-hidden rounded-2xl border bg-muted shadow-inner">
            {showVideo ? (
              <video
                src={value.previewVideoUrl}
                poster={previewImage}
                className="h-full w-full object-cover object-top"
                muted
                loop
                playsInline
                autoPlay
              />
            ) : previewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewImage}
                alt="Profile preview"
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="p-2 text-center">
                <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground/50" aria-hidden />
                <span className="mt-1 block text-[10px] text-muted-foreground">No media</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-white backdrop-blur-sm">
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              </div>
            )}
          </div>
          <span className="mt-2 text-xs font-medium text-muted-foreground">
            {showVideo ? "Video profile" : "Photo profile"}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-xs text-muted-foreground">
            Upload either a Photo or Video for the browse card. Video profiles will automatically
            generate a poster image for chat avatars and fallbacks.
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {value.avatarUrl || value.previewVideoUrl ? "Change media" : "Add profile media"}
          </Button>

          <div
            role="button"
            tabIndex={0}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
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
              className="hidden"
              disabled={uploading}
              aria-label="Upload profile photo or video"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Upload className="mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
            <p className="text-xs font-semibold">Drag & drop photo or video</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Supports JPEG, PNG, WebP, GIF, MP4, or WebM
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="profile-media-url" className="text-xs">
              Or paste URL
            </Label>
            <Input
              id="profile-media-url"
              value={showVideo ? value.previewVideoUrl : value.avatarUrl}
              onChange={(e) => {
                const url = e.target.value;
                const isVideoUrl = url.toLowerCase().endsWith(".mp4") || url.toLowerCase().endsWith(".webm");
                if (isVideoUrl) {
                  onChange({
                    avatarUrl: "",
                    previewVideoUrl: url,
                    cardDisplayMode: "video",
                  });
                } else {
                  onChange({
                    avatarUrl: url,
                    previewVideoUrl: "",
                    cardDisplayMode: "image",
                  });
                }
              }}
              placeholder="https://…/photo.jpg or video.mp4"
              type="url"
              className="h-8 text-xs"
            />
          </div>

          {(value.avatarUrl || value.previewVideoUrl) && (
            <Button type="button" variant="outline" size="sm" onClick={clearMedia}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Remove profile media
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
