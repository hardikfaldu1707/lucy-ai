"use client";

import { useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { uploadVideoToR2, isAllowedVideoFile } from "@/lib/upload-client";
import { VIDEO_MAX_UPLOAD_BYTES } from "@/lib/storage/upload-limits";
import { toast } from "sonner";
import { Upload, Link2, Film, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CharacterVideoPickerProps {
  value: string;
  onChange: (url: string) => void;
  characterId?: string;
}

export function CharacterVideoPicker({ value, onChange, characterId }: CharacterVideoPickerProps) {
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
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
      const url = await uploadVideoToR2(file, {
        scope: "character",
        characterId,
      });
      onChange(url);
      toast.success("Video uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex shrink-0 flex-col">
          <div className="relative flex aspect-[3/4] w-32 items-center justify-center overflow-hidden rounded-2xl border bg-muted shadow-inner">
            {value ? (
              <video
                src={value}
                className="h-full w-full object-cover"
                muted
                loop
                playsInline
                autoPlay
              />
            ) : (
              <div className="p-2 text-center">
                <Film className="mx-auto h-8 w-8 text-muted-foreground/50" aria-hidden />
                <span className="mt-1 block text-[10px] text-muted-foreground">No video</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-white backdrop-blur-sm">
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              </div>
            )}
          </div>
          <span className="mt-2 text-xs font-medium text-muted-foreground">Video preview</span>
        </div>

        <div className="min-w-0 flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="text-xs" type="button">
                <Upload className="mr-1 h-3 w-3" aria-hidden /> Upload
              </TabsTrigger>
              <TabsTrigger value="url" className="text-xs" type="button">
                <Link2 className="mr-1 h-3 w-3" aria-hidden /> URL
              </TabsTrigger>
            </TabsList>

            <div className="mt-3 flex min-h-[140px] flex-col justify-center rounded-xl border bg-card p-3">
              <TabsContent value="upload" className="mt-0 focus-visible:outline-none">
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
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className={cn(
                    "flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-[border-color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                  )}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="video/mp4,video/webm,.mp4,.webm"
                    className="hidden"
                    disabled={uploading}
                    aria-label="Upload preview video"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileChange(file);
                    }}
                  />
                  <Upload className="mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
                  <p className="text-xs font-semibold">Drag & drop or click to upload</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Short loop MP4/WebM, max 50MB
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="url" className="mt-0 space-y-2 focus-visible:outline-none">
                <div className="space-y-1">
                  <Label htmlFor="video-manual-url" className="text-xs">
                    Video URL
                  </Label>
                  <Input
                    id="video-manual-url"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://example.com/preview.mp4…"
                    type="url"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-8 text-xs"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Paste a direct link to a public MP4 or WebM file.
                </p>
              </TabsContent>
            </div>
          </Tabs>

          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => onChange("")}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Remove video
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
