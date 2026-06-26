"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminAiModels } from "@/hooks/use-ai-models";
import { CharacterAvatarPicker } from "./character-avatar-picker";
import { CharacterGalleryPicker } from "./character-gallery-picker";
import { CharacterProfileMediaPicker } from "./character-profile-media-picker";
import { CharacterPortraitMedia } from "@/components/home/character-portrait-media";
import { SuggestedQuestionsEditor } from "./suggested-questions-editor";
import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import { CREATE_VOICE_OPTIONS } from "@/constants/create-voices";
import type { CharacterGalleryItem } from "@/types/gallery";
import type { AdminCharacter } from "@/lib/data/admin-characters";
import { toast } from "sonner";

const DEFAULT_MODEL_VALUE = "__default__";

export interface CharacterFormValues {
  name: string;
  tagline: string;
  description: string;
  avatarUrl: string;
  previewVideoUrl: string | null;
  cardDisplayMode: "image" | "video";
  coverUrl: string | null;
  galleryItems: CharacterGalleryItem[];
  suggestedQuestions: string[];
  category: string;
  tags: string[];
  personality: string[];
  aiModel: string | null;
  systemPrompt: string | null;
  visibility: string;
  gender: string;
  style: string;
  age: number;
  voiceId: string | null;
  isPublished: boolean;
}

interface CharacterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: AdminCharacter | null;
  onSubmit: (values: CharacterFormValues) => void;
  isSubmitting: boolean;
}

function toCsv(values: string[]): string {
  return values.join(", ");
}

function fromCsv(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function CharacterForm({
  open,
  onOpenChange,
  initial,
  onSubmit,
  isSubmitting,
}: CharacterFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial?.avatarUrl ?? "");
  const [previewVideoUrl, setPreviewVideoUrl] = useState(initial?.previewVideoUrl ?? "");
  const [cardDisplayMode, setCardDisplayMode] = useState<"image" | "video">(
    initial?.cardDisplayMode ?? "image",
  );
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [galleryItems, setGalleryItems] = useState<CharacterGalleryItem[]>(
    initial?.galleryItems ?? initial?.galleryUrls?.map((url: string) => ({ url, type: "image" as const, tags: [] })) ?? [],
  );
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(
    initial?.suggestedQuestions ?? [],
  );
  const [category, setCategory] = useState(initial?.category ?? "");
  const [tags, setTags] = useState(toCsv(initial?.tags ?? []));
  const [personality, setPersonality] = useState(toCsv(initial?.personality ?? []));
  const [aiModel, setAiModel] = useState(initial?.aiModel ?? DEFAULT_MODEL_VALUE);
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? "");
  const [visibility, setVisibility] = useState(initial?.visibility ?? "public");
  const [style, setStyle] = useState(initial?.style ?? "realistic");
  const [age, setAge] = useState(String(initial?.age ?? 24));
  const [voiceId, setVoiceId] = useState(initial?.voiceId ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [activeTab, setActiveTab] = useState("basics");

  const {
    data: aiData,
    isLoading: modelsLoading,
    isError: modelsError,
    error: modelsFetchError,
  } = useAdminAiModels();

  const allModels = modelsError ? [] : (aiData?.models ?? []);
  const usingSpecificModel = aiModel !== DEFAULT_MODEL_VALUE;
  const catalogReady = !modelsLoading && !modelsError && allModels.length > 0;
  const modelCatalogBlocked = usingSpecificModel && !catalogReady;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedAvatar = avatarUrl.trim();
    if (!initial && !trimmedAvatar) {
      toast.error("Upload a photo before creating this character.");
      return;
    }
    onSubmit({
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      avatarUrl: trimmedAvatar,
      previewVideoUrl: previewVideoUrl.trim() || null,
      cardDisplayMode: previewVideoUrl.trim() ? cardDisplayMode : "image",
      coverUrl: coverUrl.trim() || null,
      galleryItems,
      suggestedQuestions,
      category: category.trim(),
      tags: fromCsv(tags),
      personality: fromCsv(personality),
      aiModel: aiModel === DEFAULT_MODEL_VALUE ? null : aiModel,
      systemPrompt: systemPrompt.trim() || null,
      visibility,
      gender: "female",
      style,
      age: Number(age) || 24,
      voiceId: voiceId.trim() || null,
      isPublished,
    });
  }

  // Live image source for preview card
  const previewImageSrc = resolveCharacterImageUrl(avatarUrl, initial?.id ?? "preview-seed");
  const tagsList = fromCsv(tags).slice(0, 3);
  const effectiveDisplayMode =
    cardDisplayMode === "video" && previewVideoUrl.trim() ? "video" : "image";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-4xl p-0 gap-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{initial ? "Edit Character" : "New Character"}</DialogTitle>
          <DialogDescription>
            Configure the companion profile, appearance, AI settings, and visibility options.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column: Labeled Tabs for settings */}
            <div className="md:col-span-7">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-5 w-full mb-4">
                  <TabsTrigger value="basics" className="text-xs">Basics</TabsTrigger>
                  <TabsTrigger value="appearance" className="text-xs">Appearance</TabsTrigger>
                  <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
                  <TabsTrigger value="ai" className="text-xs">AI</TabsTrigger>
                  <TabsTrigger value="publish" className="text-xs">Publish</TabsTrigger>
                </TabsList>

                {/* Basics Section */}
                <TabsContent value="basics" className="space-y-4 focus-visible:outline-none">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Barbara"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. MILF · Boss · Caring"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Bio Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      placeholder="Describe character's background, traits, and roleplay vibe..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Romance, Anime, Fitness"
                    />
                  </div>
                </TabsContent>

                {/* Appearance Section */}
                <TabsContent value="appearance" className="space-y-4 focus-visible:outline-none">
                  <div className="space-y-2">
                    <Label>Profile media (photo or video)</Label>
                    <CharacterProfileMediaPicker
                      value={{
                        avatarUrl,
                        previewVideoUrl,
                        cardDisplayMode,
                      }}
                      onChange={(patch) => {
                        if (patch.avatarUrl !== undefined) setAvatarUrl(patch.avatarUrl);
                        if (patch.previewVideoUrl !== undefined) {
                          setPreviewVideoUrl(patch.previewVideoUrl);
                        }
                        if (patch.cardDisplayMode !== undefined) {
                          setCardDisplayMode(patch.cardDisplayMode);
                        }
                      }}
                      characterId={initial?.id}
                      previewSeed={initial?.id ?? "preview-seed"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="style">Style</Label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger id="style"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="realistic">Realistic</SelectItem>
                          <SelectItem value="anime">Anime</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        min={18}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Caring, Confident, Warm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personality">Personality (comma separated)</Label>
                    <Input
                      id="personality"
                      value={personality}
                      onChange={(e) => setPersonality(e.target.value)}
                      placeholder="Caring, Playful, Flirty"
                    />
                  </div>
                </TabsContent>

                {/* Profile / Media Section */}
                <TabsContent value="profile" className="space-y-4 focus-visible:outline-none">
                  <div className="space-y-2">
                    <Label>Cover banner (X-style header)</Label>
                    <CharacterAvatarPicker
                      value={coverUrl}
                      onChange={setCoverUrl}
                      characterId={initial?.id}
                      hidePresets
                      cropToLandscape
                    />
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <Label className="text-sm font-semibold">Chat media library</Label>
                    <p className="text-xs text-muted-foreground">
                      Powers the user + button in chat (Photo / Video requests). Separate from
                      profile media on the Appearance tab.
                    </p>
                    <CharacterGalleryPicker
                      value={galleryItems}
                      onChange={setGalleryItems}
                      characterId={initial?.id}
                    />
                  </div>

                  <SuggestedQuestionsEditor
                    value={suggestedQuestions}
                    onChange={setSuggestedQuestions}
                    generateContext={{
                      name: name.trim(),
                      tagline: tagline.trim(),
                      description: description.trim(),
                      personality: fromCsv(personality),
                      tags: fromCsv(tags),
                      category: category.trim(),
                      style,
                      age: Number(age) || 24,
                    }}
                  />
                </TabsContent>

                {/* AI Configuration Section */}
                <TabsContent value="ai" className="space-y-4 focus-visible:outline-none">
                  <div className="space-y-2">
                    <Label htmlFor="aiModel">AI Model</Label>
                    {modelsError && (
                      <p className="text-sm text-destructive" role="alert">
                        {(modelsFetchError as Error)?.message ?? "Failed to load AI models"}
                      </p>
                    )}
                    <Select
                      value={aiModel}
                      onValueChange={setAiModel}
                      disabled={modelsLoading || modelsError}
                    >
                      <SelectTrigger id="aiModel">
                        <SelectValue placeholder={modelsLoading ? "Loading…" : "Select a model"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DEFAULT_MODEL_VALUE}>Default (platform)</SelectItem>
                        {allModels.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name} · {m.provider}{m.isFree ? " (free)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="voiceId">Voice persona (realtime calls)</Label>
                    <Select value={voiceId || "__none__"} onValueChange={(v) => setVoiceId(v === "__none__" ? "" : v)}>
                      <SelectTrigger id="voiceId">
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Default (Warm & Sweet)</SelectItem>
                        {CREATE_VOICE_OPTIONS.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.label} — {v.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="systemPrompt">System prompt (custom behavior rules)</Label>
                    <Textarea
                      id="systemPrompt"
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={6}
                      placeholder="Leave empty to auto-build from name/tagline/personality. When set, this exact prompt drives her replies."
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Overrides the default personality instructions when filled in. SAFETY_RULES are always appended.
                    </p>
                  </div>
                </TabsContent>

                {/* Publish Section */}
                <TabsContent value="publish" className="space-y-4 focus-visible:outline-none">
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility Settings</Label>
                    <Select value={visibility} onValueChange={setVisibility}>
                      <SelectTrigger id="visibility">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public (visible on homepage for everyone)</SelectItem>
                        <SelectItem value="private">Private (visible only to signed-in users)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="isPublished" className="text-sm font-semibold">Published Status</Label>
                      <p className="text-xs text-muted-foreground">Toggle availability for chat conversations.</p>
                    </div>
                    <Switch
                      id="isPublished"
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column: Sticky Live Preview Card */}
            <div className="md:col-span-5 h-full flex flex-col">
              <div className="sticky top-0 space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Live Card Preview
                </span>
                
                <div className="group relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-2xl bg-zinc-900 shadow-xl ring-1 ring-white/10 md:max-w-[240px]">
                  <CharacterPortraitMedia
                    character={{
                      id: initial?.id ?? "preview-seed",
                      name: name || "Companion Name",
                      age: Number(age) || 24,
                      image: previewImageSrc,
                      previewVideoUrl: previewVideoUrl.trim() || null,
                      cardDisplayMode: effectiveDisplayMode,
                    }}
                    sizes="280px"
                  />

                  <div className="absolute inset-x-0 bottom-0 z-10 space-y-2 p-4">
                    <h3 className="text-lg font-bold leading-tight text-white">
                      {name || "Companion Name"}{" "}
                      <span className="font-semibold text-white/80">{age}</span>
                    </h3>
                    <p className="line-clamp-2 text-xs leading-snug text-white/70">
                      {tagline || description || "Write a tagline or description to preview..."}
                    </p>
                    
                    {tagsList.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {tagsList.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white/12 px-2 py-0.5 text-[9px] font-medium text-white/90 backdrop-blur-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 pt-4 border-t gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !name.trim() ||
                modelCatalogBlocked ||
                (!initial && !avatarUrl.trim())
              }
            >
              {isSubmitting ? "Saving…" : initial ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
