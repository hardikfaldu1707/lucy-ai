"use client";

import { useEffect, useState } from "react";
import type { CreationConfig } from "@/types/character-creation-config";
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
import { Sparkles, Loader2 } from "lucide-react";
import { CharacterAvatarPicker } from "./character-avatar-picker";
import { CharacterGalleryPicker } from "./character-gallery-picker";
import { CharacterProfileMediaPicker } from "./character-profile-media-picker";
import { CharacterPortraitMedia } from "@/components/home/character-portrait-media";
import { SuggestedQuestionsEditor } from "./suggested-questions-editor";
import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import { CREATE_VOICE_OPTIONS } from "@/constants/create-voices";
import {
  CREATE_ETHNICITIES,
  CREATE_HAIR_STYLES,
  CREATE_HAIR_COLORS,
  CREATE_BODY_TYPES,
  type CharacterAppearance,
} from "@/constants/create-appearance";
import type { CharacterGalleryItem } from "@/types/gallery";
import type { AdminCharacter } from "@/lib/data/admin-characters";
import { toast } from "sonner";

const APPEARANCE_NONE = "__none__";

type AppearanceOption = { id: string; label: string };

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
  appearance: CharacterAppearance;
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

function AppearanceSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: AppearanceOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-white/80 font-medium text-xs">{label}</Label>
      <Select
        value={value || APPEARANCE_NONE}
        onValueChange={(v) => onChange(v === APPEARANCE_NONE ? "" : v)}
      >
        <SelectTrigger id={id} className="bg-white/[0.02] border-white/5 text-white rounded-xl focus:ring-pink-500/30">
          <SelectValue placeholder="Not set" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-950 border-white/5 text-white">
          <SelectItem value={APPEARANCE_NONE}>Not set</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
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
  const [ethnicity, setEthnicity] = useState(initial?.appearance?.ethnicity ?? "");
  const [hairStyle, setHairStyle] = useState(initial?.appearance?.hairStyle ?? "");
  const [hairColor, setHairColor] = useState(initial?.appearance?.hairColor ?? "");
  const [bodyType, setBodyType] = useState(initial?.appearance?.bodyType ?? "");
  const [voiceId, setVoiceId] = useState(initial?.voiceId ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [activeTab, setActiveTab] = useState("basics");
  const [analyzing, setAnalyzing] = useState(false);
  const [config, setConfig] = useState<CreationConfig | null>(null);

  useEffect(() => {
    fetch("/api/admin/creation-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.config) setConfig(data.config);
      })
      .catch((err) => console.error("Failed to load creation config:", err));
  }, []);

  const handleAiDetect = async () => {
    if (!avatarUrl) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/admin/detect-appearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to analyze image");
      }
      const data = (await res.json()) as {
        appearance: {
          style?: string;
          ethnicity?: string;
          hairColor?: string;
          hairStyle?: string;
          bodyType?: string;
        };
      };
      const app = data.appearance;
      if (app.style) setStyle(app.style);
      if (app.ethnicity) setEthnicity(app.ethnicity);
      if (app.bodyType) setBodyType(app.bodyType);
      if (app.hairStyle) setHairStyle(app.hairStyle);
      if (app.hairColor) setHairColor(app.hairColor);
      toast.success("AI auto-filled visual attributes successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to run AI detection");
    } finally {
      setAnalyzing(false);
    }
  };

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
      appearance: {
        ...(ethnicity ? { ethnicity } : {}),
        ...(hairStyle ? { hairStyle } : {}),
        ...(hairColor ? { hairColor } : {}),
        ...(bodyType ? { bodyType } : {}),
      },
      voiceId: voiceId.trim() || null,
      isPublished,
    });
  }

  // Dynamically resolve enabled steps and options from CreationConfig
  const ethnicityStep = config?.steps.find((s) => s.stepKey === "ethnicity");
  const bodyStep = config?.steps.find((s) => s.stepKey === "body");
  const hairStep = config?.steps.find((s) => s.stepType === "dual_select");

  const ethnicityEnabled = config ? (ethnicityStep?.isEnabled ?? false) : true;
  const bodyEnabled = config ? (bodyStep?.isEnabled ?? false) : true;
  const hairEnabled = config ? (hairStep?.isEnabled ?? false) : true;

  const ethnicityOptions = config
    ? (ethnicityStep?.options.filter((o) => o.isEnabled).map((o) => ({ id: o.optionKey, label: o.label })) ?? [])
    : CREATE_ETHNICITIES;

  const bodyOptions = config
    ? (bodyStep?.options.filter((o) => o.isEnabled).map((o) => ({ id: o.optionKey, label: o.label })) ?? [])
    : CREATE_BODY_TYPES;

  const hairStyleOptions = config
    ? (hairStep?.options.filter((o) => o.isEnabled && o.optionGroup === "hairStyle").map((o) => ({ id: o.optionKey, label: o.label })) ?? [])
    : CREATE_HAIR_STYLES;

  const hairColorOptions = config
    ? (hairStep?.options.filter((o) => o.isEnabled && o.optionGroup === "hairColor").map((o) => ({ id: o.optionKey, label: o.label })) ?? [])
    : CREATE_HAIR_COLORS;

  // Live image source for preview card
  const previewImageSrc = resolveCharacterImageUrl(avatarUrl, initial?.id ?? "preview-seed");
  const tagsList = fromCsv(tags).slice(0, 3);
  const effectiveDisplayMode =
    cardDisplayMode === "video" && previewVideoUrl.trim() ? "video" : "image";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[95vh] overflow-y-auto sm:max-w-4xl p-0 gap-0 bg-[#0d0d0d] border-white/5 text-white shadow-2xl shadow-black/80 backdrop-blur-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 pb-2 border-b border-white/5">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            {initial ? "Edit Companion Profile" : "Create New AI Companion"}
          </DialogTitle>
          <DialogDescription className="text-white/50 text-xs">
            Configure the companion profile, appearance, AI settings, and visibility options.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column: Labeled Tabs for settings */}
            <div className="md:col-span-7">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-5 w-full mb-6 bg-white/[0.03] border border-white/5 p-1 rounded-xl">
                  <TabsTrigger value="basics" className="text-xs rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300">Basics</TabsTrigger>
                  <TabsTrigger value="appearance" className="text-xs rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300">Appearance</TabsTrigger>
                  <TabsTrigger value="profile" className="text-xs rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300">Profile</TabsTrigger>
                  <TabsTrigger value="ai" className="text-xs rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300">AI Config</TabsTrigger>
                  <TabsTrigger value="publish" className="text-xs rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300">Publish</TabsTrigger>
                </TabsList>

                {/* Basics Section */}
                <TabsContent value="basics" className="space-y-4 focus-visible:outline-none">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/80 font-medium text-xs">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Barbara"
                      required
                      className="bg-white/[0.02] border-white/5 focus-visible:ring-pink-500/30 text-white placeholder-white/30 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tagline" className="text-white/80 font-medium text-xs">Tagline</Label>
                    <Input
                      id="tagline"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. MILF · Boss · Caring"
                      className="bg-white/[0.02] border-white/5 focus-visible:ring-pink-500/30 text-white placeholder-white/30 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white/80 font-medium text-xs">Bio Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      placeholder="Describe character's background, traits, and roleplay vibe..."
                      className="bg-white/[0.02] border-white/5 focus-visible:ring-pink-500/30 text-white placeholder-white/30 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-white/80 font-medium text-xs">Category</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Romance, Anime, Fitness"
                      className="bg-white/[0.02] border-white/5 focus-visible:ring-pink-500/30 text-white placeholder-white/30 rounded-xl"
                    />
                  </div>
                </TabsContent>

                {/* Appearance Section */}
                <TabsContent value="appearance" className="space-y-4 focus-visible:outline-none">
                  <div className="space-y-2">
                    <Label className="text-white/80 font-medium text-xs">Profile media (photo or video)</Label>
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
                      <Label htmlFor="style" className="text-white/80 font-medium text-xs">Style</Label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger id="style" className="bg-white/[0.02] border-white/5 text-white rounded-xl focus:ring-pink-500/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-white/5 text-white">
                          <SelectItem value="realistic">Realistic</SelectItem>
                          <SelectItem value="anime">Anime</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-white/80 font-medium text-xs">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        min={18}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="bg-white/[0.02] border-white/5 focus-visible:ring-pink-500/30 text-white placeholder-white/30 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-white/80 font-medium text-xs">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Caring, Confident, Warm"
                      className="bg-white/[0.02] border-white/5 focus-visible:ring-pink-500/30 text-white placeholder-white/30 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personality" className="text-white/80 font-medium text-xs">Personality (comma separated)</Label>
                    <Input
                      id="personality"
                      value={personality}
                      onChange={(e) => setPersonality(e.target.value)}
                      placeholder="Caring, Playful, Flirty"
                      className="bg-white/[0.02] border-white/5 focus-visible:ring-pink-500/30 text-white placeholder-white/30 rounded-xl"
                    />
                  </div>

                  <div className="space-y-3 border-t border-white/5 pt-4">
                    <div className="space-y-0.5 flex justify-between items-start">
                      <div>
                        <Label className="text-sm font-semibold text-white">Match attributes</Label>
                        <p className="text-xs text-white/55">
                          Tag this girl so she can be matched when a user creates one. Her
                          photos are copied to the user&apos;s girl when their picks match.
                        </p>
                      </div>
                      {avatarUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={analyzing}
                          onClick={() => void handleAiDetect()}
                          className="gap-2 text-pink-400 hover:text-pink-300 border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 text-xs py-1 h-8 shrink-0 shadow-md shadow-pink-500/5 rounded-xl transition-all duration-200"
                        >
                          {analyzing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          AI Auto Fill
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {ethnicityEnabled && (
                        <AppearanceSelect
                          id="ethnicity"
                          label="Ethnicity"
                          value={ethnicity}
                          options={ethnicityOptions}
                          onChange={setEthnicity}
                        />
                      )}
                      {bodyEnabled && (
                        <AppearanceSelect
                          id="bodyType"
                          label="Body type"
                          value={bodyType}
                          options={bodyOptions}
                          onChange={setBodyType}
                        />
                      )}
                      {hairEnabled && (
                        <>
                          <AppearanceSelect
                            id="hairStyle"
                            label="Hair style"
                            value={hairStyle}
                            options={hairStyleOptions}
                            onChange={setHairStyle}
                          />
                          <AppearanceSelect
                            id="hairColor"
                            label="Hair color"
                            value={hairColor}
                            options={hairColorOptions}
                            onChange={setHairColor}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Profile / Media Section */}
                <TabsContent value="profile" className="space-y-4 focus-visible:outline-none">
                  <div className="space-y-2">
                    <Label className="text-white/80 font-medium text-xs">Cover banner (X-style header)</Label>
                    <CharacterAvatarPicker
                      value={coverUrl}
                      onChange={setCoverUrl}
                      characterId={initial?.id}
                      hidePresets
                      cropToLandscape
                    />
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <Label className="text-sm font-semibold text-white">Chat media library</Label>
                    <p className="text-xs text-white/55">
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
                    <Label htmlFor="aiModel" className="text-white/80 font-medium text-xs">AI Model</Label>
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
                      <SelectTrigger id="aiModel" className="bg-white/[0.02] border-white/5 text-white rounded-xl focus:ring-pink-500/30">
                        <SelectValue placeholder={modelsLoading ? "Loading…" : "Select a model"} />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-white/5 text-white">
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
                    <Label htmlFor="voiceId" className="text-white/80 font-medium text-xs">Voice persona (realtime calls)</Label>
                    <Select value={voiceId || "__none__"} onValueChange={(v) => setVoiceId(v === "__none__" ? "" : v)}>
                      <SelectTrigger id="voiceId" className="bg-white/[0.02] border-white/5 text-white rounded-xl focus:ring-pink-500/30">
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-white/5 text-white">
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
                    <Label htmlFor="systemPrompt" className="text-white/80 font-medium text-xs">System prompt (custom behavior rules)</Label>
                    <Textarea
                      id="systemPrompt"
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={6}
                      placeholder="Leave empty to auto-build from name/tagline/personality. When set, this exact prompt drives her replies."
                      className="bg-white/[0.02] border-white/5 focus-visible:ring-pink-500/30 text-white placeholder-white/30 rounded-xl"
                    />
                    <p className="text-[10px] text-white/45">
                      Overrides the default personality instructions when filled in. SAFETY_RULES are always appended.
                    </p>
                  </div>
                </TabsContent>

                {/* Publish Section */}
                <TabsContent value="publish" className="space-y-4 focus-visible:outline-none">
                  <div className="space-y-2">
                    <Label htmlFor="visibility" className="text-white/80 font-medium text-xs">Visibility Settings</Label>
                    <Select value={visibility} onValueChange={setVisibility}>
                      <SelectTrigger id="visibility" className="bg-white/[0.02] border-white/5 text-white rounded-xl focus:ring-pink-500/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-white/5 text-white">
                        <SelectItem value="public">Public (visible on homepage for everyone)</SelectItem>
                        <SelectItem value="private">Private (visible only to signed-in users)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/5 p-4 bg-white/[0.02]">
                    <div className="space-y-0.5">
                      <Label htmlFor="isPublished" className="text-sm font-semibold text-white">Published Status</Label>
                      <p className="text-xs text-white/55">Toggle availability for chat conversations.</p>
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
              <div className="sticky top-0 space-y-3">
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider block">
                  Live Card Preview
                </span>
                
                <div className="group relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-2xl bg-zinc-950 border border-white/5 shadow-2xl shadow-pink-500/5 ring-2 ring-pink-500/10 md:max-w-[240px]">
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

                  <div className="absolute inset-x-0 bottom-0 z-10 space-y-2 p-4 bg-gradient-to-t from-black via-black/80 to-transparent pt-12">
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

          <DialogFooter className="mt-6 pt-4 border-t border-white/5 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl border-white/10 hover:bg-white/[0.06] text-white/80 hover:text-white"
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
              className="rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-600 font-bold text-white shadow-md shadow-pink-500/20 hover:from-pink-400 hover:to-fuchsia-500 transition-all duration-200 active:scale-95 disabled:opacity-40"
            >
              {isSubmitting ? "Saving…" : initial ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
