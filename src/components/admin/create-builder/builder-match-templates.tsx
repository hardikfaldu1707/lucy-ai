"use client";

import { useEffect, useState, useRef } from "react";
import { ImageIcon, Loader2, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadToR2, isAllowedImageFile } from "@/lib/upload-client";
import type { CreationConfig } from "@/types/character-creation-config";
import type { AdminCharacter } from "@/lib/data/admin-characters";

interface BuilderMatchTemplatesProps {
  config: CreationConfig;
}

export function BuilderMatchTemplates({ config }: BuilderMatchTemplatesProps) {
  const [characters, setCharacters] = useState<AdminCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState("Companion Match");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // Attributes states
  const [selectedStyle, setSelectedStyle] = useState("realistic");
  const [selectedEthnicity, setSelectedEthnicity] = useState("");
  const [selectedBodyType, setSelectedBodyType] = useState("");
  const [selectedOutfit, setSelectedOutfit] = useState("");
  const [selectedHairStyle, setSelectedHairStyle] = useState("");
  const [selectedHairColor, setSelectedHairColor] = useState("");

  // Gallery states
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  // Extract wizard choices from config dynamically
  const styleStep = config.steps.find((s) => s.stepKey === "style");
  const ethnicityStep = config.steps.find((s) => s.stepKey === "ethnicity");
  const bodyStep = config.steps.find((s) => s.stepKey === "body");
  const outfitStep = config.steps.find((s) => s.stepKey === "outfit");
  const hairStep = config.steps.find((s) => s.stepType === "dual_select");

  const styleOptions = styleStep?.options.filter((o) => o.isEnabled) || [];
  const ethnicityOptions = ethnicityStep?.options.filter((o) => o.isEnabled) || [];
  const bodyOptions = bodyStep?.options.filter((o) => o.isEnabled) || [];
  const outfitOptions = outfitStep?.options.filter((o) => o.isEnabled) || [];
  const hairStyleOptions = hairStep?.options.filter((o) => o.isEnabled && o.optionGroup === "hairStyle") || [];
  const hairColorOptions = hairStep?.options.filter((o) => o.isEnabled && o.optionGroup === "hairColor") || [];

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/characters");
      if (!res.ok) throw new Error("Failed to load templates");
      const json = (await res.json()) as { characters: AdminCharacter[] };
      // Filter out admin templates (createdBy is null)
      const templates = json.characters.filter((c) => c.createdBy === null);
      setCharacters(templates);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load database templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTemplates();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAllowedImageFile(file)) {
      toast.error("Please upload a valid image file (JPEG, PNG, WebP)");
      return;
    }
    setUploadingAvatar(true);
    try {
      const url = await uploadToR2(file, { scope: "character" });
      setAvatarUrl(url);
      toast.success("Main portrait uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingGallery(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        if (isAllowedImageFile(file)) {
          const url = await uploadToR2(file, { scope: "character" });
          urls.push(url);
        }
      }
      setGalleryUrls((prev) => [...prev, ...urls]);
      toast.success(`${urls.length} gallery image(s) uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gallery upload failed");
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template character?")) return;
    try {
      const res = await fetch(`/api/admin/characters/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Template deleted successfully");
      void fetchTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarUrl) {
      toast.error("Please upload a main portrait image");
      return;
    }
    setSaving(true);
    try {
      const styleLabel = selectedStyle === "realistic" ? "Realistic" : "Anime";
      const ethnicityLabel = ethnicityStep?.options.find((o) => o.optionKey === selectedEthnicity)?.label || "";
      const hairColorLabel = hairStep?.options.find((o) => o.optionKey === selectedHairColor && o.optionGroup === "hairColor")?.label || "";
      const generatedName = [styleLabel, ethnicityLabel, hairColorLabel, "Companion"].filter(Boolean).join(" ");

      const payload = {
        name: generatedName,
        avatarUrl,
        style: selectedStyle,
        gender: "female",
        isPublished: true,
        visibility: "public",
        appearance: {
          ...(selectedEthnicity ? { ethnicity: selectedEthnicity } : {}),
          ...(selectedBodyType ? { bodyType: selectedBodyType } : {}),
          ...(selectedHairStyle ? { hairStyle: selectedHairStyle } : {}),
          ...(selectedHairColor ? { hairColor: selectedHairColor } : {}),
          ...(selectedOutfit ? { outfit: selectedOutfit } : {}),
        },
        galleryItems: galleryUrls.map((url) => ({
          url,
          type: "image",
          tags: [],
        })),
      };

      const res = await fetch("/api/admin/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Failed to save match companion");
      }

      toast.success("New match companion added to database");
      setUploadDialogOpen(false);
      // Reset form
      setName("Companion Match");
      setAvatarUrl("");
      setGalleryUrls([]);
      setSelectedEthnicity("");
      setSelectedBodyType("");
      setSelectedHairStyle("");
      setSelectedHairColor("");
      setSelectedOutfit("");
      void fetchTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-bold">Photo Match Database</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload girl photos and tag them with steps. When a user creates a companion matching these steps, these photos are displayed.
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Match Photo
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading templates...
        </div>
      ) : characters.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-2xl p-6 text-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-2" />
          <p className="font-semibold text-sm">No match photos stored yet</p>
          <p className="text-xs max-w-sm mt-1">
            Upload girls' photos and tag their attributes to allow user selections to match them.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {characters.map((char) => (
            <div
              key={char.id}
              className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className="relative aspect-[3/4] w-full bg-muted overflow-hidden">
                {char.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={char.avatarUrl}
                    alt={char.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-muted/40">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80" />
                
                {/* Actions overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 rounded-lg shadow-md"
                    onClick={() => void handleDeleteTemplate(char.id)}
                    title="Delete companion"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="font-bold text-sm truncate">{char.name}</p>
                  <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">
                    {char.style} style
                  </p>
                </div>
              </div>
              
              {/* Tags summary */}
              <div className="p-3 flex-1 flex flex-col justify-between gap-2 bg-muted/5">
                <div className="flex flex-wrap gap-1">
                  {char.appearance?.ethnicity && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary-foreground font-semibold uppercase tracking-wide">
                      {char.appearance.ethnicity}
                    </span>
                  )}
                  {char.appearance?.bodyType && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 font-semibold uppercase tracking-wide">
                      {char.appearance.bodyType}
                    </span>
                  )}
                  {char.appearance?.hairStyle && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 font-semibold uppercase tracking-wide">
                      {char.appearance.hairStyle}
                    </span>
                  )}
                  {char.appearance?.hairColor && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-semibold uppercase tracking-wide">
                      {char.appearance.hairColor}
                    </span>
                  )}
                  {char.appearance?.outfit && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 font-semibold uppercase tracking-wide">
                      {char.appearance.outfit}
                    </span>
                  )}
                </div>
                {char.galleryItems && char.galleryItems.length > 0 && (
                  <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 border-t pt-1.5 mt-1">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    +{char.galleryItems.length} Gallery Photos
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Match Companion</DialogTitle>
            <DialogDescription>
              Upload portrait image and select matching attribute tags.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void handleSaveTemplate(e)} className="space-y-5 py-2">
            {/* Portrait Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Portrait Image (Required)</Label>
              <div className="flex gap-4 items-center">
                <div className="relative h-28 w-24 shrink-0 rounded-xl bg-muted border overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : uploadingAvatar ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                  )}
                </div>
                <div className="space-y-1">
                  <input
                    ref={avatarFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void handleAvatarUpload(e)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingAvatar}
                    onClick={() => avatarFileRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" /> Upload Photo
                  </Button>
                  <p className="text-xs text-muted-foreground">JPEG, PNG, WebP. Max 10MB.</p>
                </div>
              </div>
            </div>


            {/* Attributes Selection */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-semibold">Match Attributes (Tag selections)</Label>
              <div className="grid grid-cols-2 gap-3">
                {/* Style */}
                <div className="space-y-1.5">
                  <Label htmlFor="sel-style" className="text-xs">Art Style</Label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger id="sel-style">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realistic">Realistic</SelectItem>
                      <SelectItem value="anime">Anime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Ethnicity */}
                <div className="space-y-1.5">
                  <Label htmlFor="sel-ethnicity" className="text-xs">Ethnicity</Label>
                  <Select value={selectedEthnicity} onValueChange={setSelectedEthnicity}>
                    <SelectTrigger id="sel-ethnicity">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not set</SelectItem>
                      {ethnicityOptions.map((o) => (
                        <SelectItem key={o.id} value={o.optionKey}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Body Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="sel-body" className="text-xs">Body Type</Label>
                  <Select value={selectedBodyType} onValueChange={setSelectedBodyType}>
                    <SelectTrigger id="sel-body">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not set</SelectItem>
                      {bodyOptions.map((o) => (
                        <SelectItem key={o.id} value={o.optionKey}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Hair Style */}
                <div className="space-y-1.5">
                  <Label htmlFor="sel-hair-style" className="text-xs">Hair Style</Label>
                  <Select value={selectedHairStyle} onValueChange={setSelectedHairStyle}>
                    <SelectTrigger id="sel-hair-style">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not set</SelectItem>
                      {hairStyleOptions.map((o) => (
                        <SelectItem key={o.id} value={o.optionKey}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Hair Color */}
                <div className="space-y-1.5">
                  <Label htmlFor="sel-hair-color" className="text-xs">Hair Color</Label>
                  <Select value={selectedHairColor} onValueChange={setSelectedHairColor}>
                    <SelectTrigger id="sel-hair-color">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not set</SelectItem>
                      {hairColorOptions.map((o) => (
                        <SelectItem key={o.id} value={o.optionKey}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Outfit */}
                <div className="space-y-1.5">
                  <Label htmlFor="sel-outfit" className="text-xs">Outfit</Label>
                  <Select value={selectedOutfit} onValueChange={setSelectedOutfit}>
                    <SelectTrigger id="sel-outfit">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not set</SelectItem>
                      {outfitOptions.map((o) => (
                        <SelectItem key={o.id} value={o.optionKey}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Gallery Upload */}
            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm font-semibold">Photoshoot Gallery (Optional photoshoot pictures)</Label>
              <div className="flex gap-2 flex-wrap">
                {galleryUrls.map((url, index) => (
                  <div key={index} className="relative h-16 w-14 border rounded-lg bg-muted overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setGalleryUrls((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute top-0.5 right-0.5 h-4 w-4 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-destructive"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
                <div className="h-16 w-14 shrink-0 border border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/20">
                  <input
                    ref={galleryFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => void handleGalleryUpload(e)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-full w-full text-muted-foreground/60"
                    disabled={uploadingGallery}
                    onClick={() => galleryFileRef.current?.click()}
                  >
                    {uploadingGallery ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !avatarUrl}>
                {saving ? "Saving…" : "Save Match Photo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
