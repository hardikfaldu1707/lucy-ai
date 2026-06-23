"use client";

import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ADMIN_PORTRAIT_PRESETS } from "@/constants/character-portraits";
import { uploadToR2, isAllowedImageFile } from "@/lib/upload-client";
import { cropImageToCoverBanner } from "@/lib/image/crop-to-landscape";
import { toast } from "sonner";
import { Upload, Link2, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CharacterAvatarPickerProps {
  value: string;
  onChange: (url: string) => void;
  characterId?: string;
  hidePresets?: boolean;
  variant?: "admin" | "create";
  uploadScope?: "user" | "character";
  /** Cover banner: crop uploads to 3:1 header banner. */
  cropToLandscape?: boolean;
}

export function CharacterAvatarPicker({
  value,
  onChange,
  characterId,
  hidePresets = false,
  variant = "admin",
  uploadScope,
  cropToLandscape = false,
}: CharacterAvatarPickerProps) {
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCreate = variant === "create";
  const tabCols = hidePresets ? "grid-cols-2" : "grid-cols-3";

  const handleFileChange = async (file: File) => {
    if (!isAllowedImageFile(file)) {
      toast.error("Please upload a supported image (JPEG, PNG, WebP, or GIF)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const scope =
        uploadScope ?? (characterId ? "character" : "user");
      const uploadFile = cropToLandscape ? await cropImageToCoverBanner(file) : file;
      const url = await uploadToR2(uploadFile, {
        scope,
        characterId: scope === "character" ? characterId : undefined,
      });
      onChange(url);
      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed. R2 might not be configured.");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className={cn("flex flex-col shrink-0", cropToLandscape ? "w-full sm:w-72" : "")}>
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border shadow-inner flex items-center justify-center",
              cropToLandscape ? "aspect-[3/1] w-full" : "aspect-[3/4] w-32",
              isCreate ? "border-white/15 bg-white/5" : "bg-muted",
            )}
          >
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt={cropToLandscape ? "Cover preview" : "Avatar preview"}
                width={cropToLandscape ? 360 : 128}
                height={cropToLandscape ? 120 : 171}
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <div className="text-center p-2">
                <ImageIcon
                  className={cn(
                    "mx-auto h-8 w-8",
                    isCreate ? "text-white/40" : "text-muted-foreground/50",
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "text-[10px] block mt-1",
                    isCreate ? "text-white/50" : "text-muted-foreground",
                  )}
                >
                  No Image
                </span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white backdrop-blur-sm rounded-2xl">
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              </div>
            )}
          </div>
          <span
            className={cn(
              "text-xs mt-2 font-medium",
              isCreate ? "text-white/60" : "text-muted-foreground",
            )}
          >
            {cropToLandscape ? "Cover preview" : "Avatar Preview"}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={cn("grid w-full", tabCols, isCreate && "border-white/10 bg-white/5")}>
              <TabsTrigger value="upload" className="text-xs">
                <Upload className="h-3 w-3 mr-1" aria-hidden="true" /> Upload
              </TabsTrigger>
              {!hidePresets && (
                <TabsTrigger value="presets" className="text-xs">
                  <ImageIcon className="h-3 w-3 mr-1" aria-hidden="true" /> Presets
                </TabsTrigger>
              )}
              <TabsTrigger value="url" className="text-xs">
                <Link2 className="h-3 w-3 mr-1" aria-hidden="true" /> URL
              </TabsTrigger>
            </TabsList>

            <div
              className={cn(
                "mt-3 min-h-[140px] border rounded-xl p-3 flex flex-col justify-center",
                isCreate ? "border-white/10 bg-white/5" : "bg-card",
              )}
            >
              <TabsContent value="upload" className="mt-0 focus-visible:outline-none">
                <div
                  role="button"
                  tabIndex={0}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-[border-color,background-color] flex flex-col items-center justify-center min-h-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isDragOver
                      ? isCreate
                        ? "border-pink-500 bg-pink-500/10"
                        : "border-primary bg-primary/5"
                      : isCreate
                        ? "border-white/20 hover:border-pink-500/50 hover:bg-white/5"
                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                  )}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    aria-label="Upload avatar image"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileChange(file);
                    }}
                  />
                  <Upload
                    className={cn(
                      "h-6 w-6 mb-2",
                      isCreate ? "text-white/50" : "text-muted-foreground",
                    )}
                    aria-hidden="true"
                  />
                  <p className={cn("text-xs font-semibold", isCreate && "text-white/90")}>
                    Drag & drop or click to upload
                  </p>
                  <p
                    className={cn(
                      "text-[10px] mt-1",
                      isCreate ? "text-white/45" : "text-muted-foreground",
                    )}
                  >
                    {cropToLandscape
                      ? "3:1 header banner — portrait photos auto-crop from the top"
                      : "Supports PNG, JPG, WEBP up to 10MB"}
                  </p>
                </div>
              </TabsContent>

              {!hidePresets && (
                <TabsContent value="presets" className="mt-0 focus-visible:outline-none">
                  <ScrollArea className="h-[140px] pr-2">
                    <div className="grid grid-cols-4 gap-2">
                      {ADMIN_PORTRAIT_PRESETS.map((preset) => {
                        const isSelected = value === preset.url;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => onChange(preset.url)}
                            className={`group relative aspect-[3/4] overflow-hidden rounded-lg border transition-[border-color,transform] ${
                              isSelected
                                ? "border-primary ring-2 ring-primary/20 scale-[0.98]"
                                : "border-border hover:border-muted-foreground/50"
                            }`}
                            title={preset.label}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={preset.url}
                              alt={preset.label}
                              width={80}
                              height={107}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-center">
                              <span className="text-[9px] text-white truncate block">
                                {preset.label}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>
              )}

              <TabsContent value="url" className="mt-0 focus-visible:outline-none space-y-2">
                <div className="space-y-1">
                  <Label
                    htmlFor="avatar-manual-url"
                    className={cn("text-xs", isCreate && "text-white/80")}
                  >
                    Image URL
                  </Label>
                  <Input
                    id="avatar-manual-url"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://example.com/image.jpg…"
                    type="url"
                    autoComplete="off"
                    spellCheck={false}
                    className={cn(
                      "h-8 text-xs",
                      isCreate && "border-white/15 bg-white/5 text-white",
                    )}
                  />
                </div>
                <p className={cn("text-[10px]", isCreate ? "text-white/45" : "text-muted-foreground")}>
                  Paste a direct link to any public image URL.
                </p>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
