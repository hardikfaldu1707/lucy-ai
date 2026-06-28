"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Globe,
  Heart,
  Mic,
  Sparkles,
  User,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppearanceGrid, OptionPreviewImage } from "@/components/create/create-wizard-parts";
import type { CreateStyle } from "@/constants/create-page";
import { ROUTES } from "@/constants/routes";
import { submitUserCharacter } from "@/lib/characters/create-character-client";
import {
  clearCreateDraft,
  DEFAULT_CREATE_DRAFT,
  draftToPayload,
  isDraftReadyForSubmit,
  loadCreateDraft,
  markCreateAutoSubmit,
  saveCreateDraft,
  shouldAutoSubmitCreate,
  type CreateCharacterDraft,
} from "@/lib/characters/create-draft";
import {
  getEnabledOptions,
  getEnabledSteps,
  labelFromConfig,
  optionsToAppearanceList,
} from "@/lib/characters/creation-config-utils";
import { resolveCreateAvatarFromDraftWithConfig } from "@/lib/characters/resolve-create-avatar";
import { cn } from "@/lib/utils";
import { useFlag } from "@/hooks/use-flags";
import type { CreationConfig, CreationStep } from "@/types/character-creation-config";

const PROGRESS_ICONS = [User, Globe, Sparkles, User, Sparkles, Heart, Sparkles, Mic, Heart] as const;

export type WizardShellMode = "create" | "edit" | "preview" | "fullscreen-preview";

export interface CreateWizardShellProps {
  config: CreationConfig;
  mode?: WizardShellMode;
  characterId?: string;
  initialDraft?: CreateCharacterDraft;
  /** Controlled draft for preview modes */
  draft?: CreateCharacterDraft;
  onDraftChange?: (draft: CreateCharacterDraft) => void;
  previewStep?: number;
  onPreviewStepChange?: (step: number) => void;
  device?: "desktop" | "mobile";
  hideFooter?: boolean;
  compact?: boolean;
  readOnly?: boolean;
}

function signInHrefForCreateWithDraft(): string {
  const params = new URLSearchParams({ redirect_url: ROUTES.create, from: "create" });
  return `${ROUTES.login}?${params.toString()}`;
}

function CreatePortraitPreview({
  draft,
  config,
}: {
  draft: CreateCharacterDraft;
  config: CreationConfig;
}) {
  const portraitSrc = useMemo(
    () => resolveCreateAvatarFromDraftWithConfig(config, draft),
    [config, draft],
  );
  const displayName = draft.name.trim() || "Your AI girl";

  return (
    <div className="mx-auto w-full max-w-[200px] lg:max-w-none">
      <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-white/45 lg:text-left">
        Live preview
      </p>
      <div className="overflow-hidden rounded-2xl ring-2 ring-white/10">
        <div className="relative aspect-[3/4] w-full bg-black/40">
          <OptionPreviewImage src={portraitSrc || null} alt={displayName} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            {draft.relationship && (
              <p className="truncate text-xs text-white/60">{draft.relationship}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function canAdvanceStep(step: CreationStep, draft: CreateCharacterDraft): boolean {
  if (!step.isRequired) return true;
  switch (step.stepType) {
    case "single_select":
      if (step.stepKey === "style") return true;
      if (step.stepKey === "ethnicity") return draft.ethnicity.length > 0;
      if (step.stepKey === "body") return draft.bodyType.length > 0;
      if (step.stepKey === "outfit") return draft.outfit.length > 0;
      return true;
    case "dual_select":
      return draft.hairStyle.length > 0 && draft.hairColor.length > 0;
    case "identity": {
      const minAge = step.config.minAge ?? 18;
      return draft.name.trim().length > 0 && draft.age >= minAge;
    }
    case "multi_select":
      return draft.personality.length > 0;
    case "voice":
      return draft.voicePersonaId.length > 0;
    case "review":
      return draft.relationship.length > 0;
    default:
      return true;
  }
}

export function CreateWizardShell({
  config,
  mode = "create",
  characterId,
  initialDraft,
  draft: controlledDraft,
  onDraftChange,
  previewStep: controlledPreviewStep,
  onPreviewStepChange,
  device = "desktop",
  hideFooter = false,
  compact = false,
  readOnly = false,
}: CreateWizardShellProps) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const canCreate = useFlag("user_created_characters");
  const isPreview = mode === "preview" || mode === "fullscreen-preview";

  const activeSteps = useMemo(() => getEnabledSteps(config), [config]);
  const stepCount = activeSteps.length;

  const [internalStep, setInternalStep] = useState(0);
  const [internalDraft, setInternalDraft] = useState<CreateCharacterDraft>(
    initialDraft || DEFAULT_CREATE_DRAFT,
  );
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const draft = controlledDraft ?? internalDraft;
  const step = controlledPreviewStep ?? internalStep;
  const currentStep = activeSteps[step];

  const setStep = useCallback(
    (next: number | ((s: number) => number)) => {
      const value = typeof next === "function" ? next(step) : next;
      if (onPreviewStepChange) onPreviewStepChange(value);
      else setInternalStep(value);
    },
    [onPreviewStepChange, step],
  );

  const updateDraft = useCallback(
    (patch: Partial<CreateCharacterDraft>) => {
      const next = { ...draft, ...patch };
      if (onDraftChange) onDraftChange(next);
      else {
        setInternalDraft(next);
        if (mode === "create") saveCreateDraft(next);
      }
    },
    [draft, mode, onDraftChange],
  );

  useEffect(() => {
    if (isPreview) return;
    if (mode === "create") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInternalDraft(loadCreateDraft());
    } else if (initialDraft) {
      setInternalDraft(initialDraft);
    }
    setHydrated(true);
  }, [mode, initialDraft, isPreview]);

  const runSubmit = useCallback(async () => {
    if (!isDraftReadyForSubmit(draft)) {
      toast.error("Complete all required fields first.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = draftToPayload(draft, config);
      if (mode === "edit" && characterId) {
        const res = await fetch(`/api/characters/${encodeURIComponent(characterId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? "Failed to update character");
        }
        toast.success("Your AI girl is updated!");
        const json = (await res.json()) as { character: { slug?: string; id: string } };
        router.push(ROUTES.myGirl(json.character.slug ?? json.character.id));
      } else {
        const { slug } = await submitUserCharacter(payload);
        clearCreateDraft();
        toast.success("Your AI girl is ready!");
        router.push(ROUTES.myGirl(slug));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }, [draft, router, mode, characterId, config]);

  useEffect(() => {
    if (mode !== "create" || isPreview) return;
    if (!hydrated || !isLoaded || !isSignedIn) return;
    if (!shouldAutoSubmitCreate()) return;
    const loaded = loadCreateDraft();
    if (!isDraftReadyForSubmit(loaded)) return;
    void (async () => {
      setSubmitting(true);
      try {
        const { slug } = await submitUserCharacter(draftToPayload(loaded, config));
        clearCreateDraft();
        toast.success("Your AI girl is ready!");
        router.push(ROUTES.myGirl(slug));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create");
      } finally {
        setSubmitting(false);
      }
    })();
  }, [hydrated, isLoaded, isSignedIn, router, mode, config, isPreview]);

  function toggleTrait(trait: string) {
    const max = config.steps.find((s) => s.stepKey === "personality")?.config.maxSelections ?? 5;
    const next = draft.personality.includes(trait)
      ? draft.personality.filter((t) => t !== trait)
      : draft.personality.length < max
        ? [...draft.personality, trait]
        : draft.personality;
    updateDraft({ personality: next });
  }

  async function previewVoice(voicePersonaId: string) {
    if (isPreview || readOnly) return;
    if (previewingVoice === voicePersonaId) return;
    setPreviewingVoice(voicePersonaId);
    try {
      const res = await fetch("/api/voice/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ voicePersonaId }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Preview failed");
      }
      const { audioBase64, mime } = (await res.json()) as { audioBase64: string; mime: string };
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(`data:${mime};base64,${audioBase64}`);
      audioRef.current = audio;
      await audio.play();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Voice preview failed");
    } finally {
      setPreviewingVoice(null);
    }
  }

  function canAdvance(): boolean {
    if (!currentStep) return false;
    return canAdvanceStep(currentStep, draft);
  }

  function handleNext() {
    if (step < stepCount - 1) {
      setStep((s) => s + 1);
      return;
    }
    if (!isPreview) handleCreate();
  }

  function handleCreate() {
    if (isPreview) return;
    if (!isDraftReadyForSubmit(draft)) {
      toast.error("Fill in all required steps before creating.");
      return;
    }
    if (!isSignedIn) {
      saveCreateDraft(draft);
      markCreateAutoSubmit();
      router.push(signInHrefForCreateWithDraft());
      return;
    }
    void runSubmit();
  }

  const reviewPortraitSrc = resolveCreateAvatarFromDraftWithConfig(config, draft);

  if (mode === "create" && canCreate === false) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-white">
        <p className="text-lg font-semibold">Character creation is unavailable</p>
        <p className="mt-2 text-sm text-white/60">
          This feature has been disabled. Browse existing companions instead.
        </p>
        <Button asChild className="mt-6 rounded-full bg-primary hover:bg-primary/95 text-white">
          <a href={ROUTES.publicChatNew}>Browse companions</a>
        </Button>
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="p-8 text-center text-white/60">
        No enabled steps in wizard configuration.
      </div>
    );
  }

  function renderStepContent(stepDef: CreationStep) {
    switch (stepDef.stepType) {
      case "single_select":
        if (stepDef.stepKey === "style") {
          const styles = optionsToAppearanceList(stepDef);
          return (
            <section className="space-y-8">
              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                {styles.map((item) => {
                  const selected = draft.style === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => !readOnly && updateDraft({ style: item.id as CreateStyle })}
                      disabled={readOnly}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl text-left ring-2 transition-all sm:rounded-3xl",
                        selected
                          ? "ring-primary shadow-[0_0_32px_-8px_rgba(124,58,237,0.5)]"
                          : "ring-white/10 hover:ring-white/25",
                      )}
                      aria-pressed={selected}
                    >
                      <div className="relative aspect-[3/4] w-full">
                        <OptionPreviewImage src={item.image} alt={`${item.label} style`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                        {selected && (
                          <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                            <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                          </span>
                        )}
                        <span
                          className={cn(
                            "absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-5 py-1.5 text-sm font-semibold",
                            selected ? "bg-primary text-white" : "bg-black/60 text-white/90",
                          )}
                        >
                          {item.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        }
        return (
          <section className="space-y-4">
            {stepDef.description && (
              <p className="text-center text-sm text-white/60">{stepDef.description}</p>
            )}
            <AppearanceGrid
              options={optionsToAppearanceList(stepDef)}
              value={
                stepDef.stepKey === "ethnicity"
                  ? draft.ethnicity
                  : stepDef.stepKey === "body"
                    ? draft.bodyType
                    : draft.outfit
              }
              onChange={(id) => {
                if (stepDef.stepKey === "ethnicity") updateDraft({ ethnicity: id });
                else if (stepDef.stepKey === "body") updateDraft({ bodyType: id });
                else if (stepDef.stepKey === "outfit") updateDraft({ outfit: id });
              }}
              columns={stepDef.stepKey === "body" ? 3 : 4}
              readOnly={readOnly}
            />
          </section>
        );

      case "dual_select":
        return (
          <section className="space-y-8">
            <div className="space-y-3">
              <p className="text-center text-sm font-medium text-white/80">Hair style</p>
              <AppearanceGrid
                options={optionsToAppearanceList(stepDef, "hairStyle")}
                value={draft.hairStyle}
                onChange={(id) => updateDraft({ hairStyle: id })}
                columns={4}
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-3">
              <p className="text-center text-sm font-medium text-white/80">Hair color</p>
              <AppearanceGrid
                options={optionsToAppearanceList(stepDef, "hairColor")}
                value={draft.hairColor}
                onChange={(id) => updateDraft({ hairColor: id })}
                columns={4}
                readOnly={readOnly}
              />
            </div>
          </section>
        );

      case "identity":
        return (
          <section className="mx-auto max-w-md space-y-5">
            <div className="space-y-2">
              <Label htmlFor="create-name" className="text-white/80">
                {stepDef.config.nameLabel ?? "Name"}
              </Label>
              <Input
                id="create-name"
                value={draft.name}
                onChange={(e) => updateDraft({ name: e.target.value })}
                placeholder="e.g. Luna"
                className="border-white/15 bg-white/5 text-white"
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-age" className="text-white/80">
                {stepDef.config.ageLabel ?? "Age"}
              </Label>
              <Input
                id="create-age"
                type="number"
                min={stepDef.config.minAge ?? 18}
                max={stepDef.config.maxAge ?? 120}
                value={draft.age}
                onChange={(e) => updateDraft({ age: Number(e.target.value) || 18 })}
                className="border-white/15 bg-white/5 text-white"
                readOnly={readOnly}
              />
            </div>
          </section>
        );

      case "multi_select": {
        const traitOptions = getEnabledOptions(stepDef);
        const maxSel = stepDef.config.maxSelections ?? 5;
        return (
          <section className="mx-auto max-w-lg space-y-5">
            <p className="text-center text-sm text-white/60">
              Pick up to {maxSel} traits that define her personality.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {traitOptions.map((opt) => {
                const selected = draft.personality.includes(opt.optionKey);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => !readOnly && toggleTrait(opt.optionKey)}
                    disabled={readOnly}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      selected
                        ? "bg-primary text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/15",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-bio" className="text-white/80">
                About her (optional)
              </Label>
              <Textarea
                id="create-bio"
                value={draft.description}
                onChange={(e) => updateDraft({ description: e.target.value })}
                rows={3}
                placeholder="A few lines about who she is..."
                className="border-white/15 bg-white/5 text-white"
                readOnly={readOnly}
              />
            </div>
          </section>
        );
      }

      case "voice": {
        const voices = getEnabledSteps(config)
          .find((s) => s.stepKey === "voice")
          ?.options.filter((o) => o.isEnabled)
          .sort((a, b) => a.sortOrder - b.sortOrder) ?? stepDef.options.filter((o) => o.isEnabled);

        return (
          <section className="mx-auto max-w-lg space-y-4">
            <p className="text-center text-sm text-white/60">
              Choose her voice — tap to select{!isPreview && ", use preview to hear a sample"}.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {voices.map((voice) => {
                const selected = draft.voicePersonaId === voice.optionKey;
                const loading = previewingVoice === voice.optionKey;
                return (
                  <div
                    key={voice.id}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border p-3 transition-colors",
                      selected ? "border-primary bg-primary/15" : "border-white/10 bg-white/5",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => !readOnly && updateDraft({ voicePersonaId: voice.optionKey })}
                      disabled={readOnly}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="text-sm font-semibold text-white">{voice.label}</p>
                      <p className="text-xs text-white/55">
                        {(voice.metadata.description as string) ?? ""}
                      </p>
                    </button>
                    {!isPreview && (
                      <button
                        type="button"
                        onClick={() => previewVoice(voice.optionKey)}
                        disabled={loading || readOnly}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-50"
                        aria-label={`Preview ${voice.label}`}
                      >
                        <Volume2 className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      }

      case "review": {
        const relOptions = getEnabledOptions(stepDef);
        return (
          <section className="mx-auto max-w-lg space-y-6">
            <p className="text-center text-sm text-white/60">What is your relationship with her?</p>
            <div className="flex flex-wrap justify-center gap-2">
              {relOptions.map((opt) => {
                const selected = draft.relationship === opt.optionKey;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => !readOnly && updateDraft({ relationship: opt.optionKey })}
                    disabled={readOnly}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      selected
                        ? "bg-primary text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/15",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold">Review</h2>
              <div className="mt-4 flex gap-4">
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
                  <OptionPreviewImage src={reviewPortraitSrc || null} alt={draft.name || "Preview"} />
                </div>
                <dl className="min-w-0 flex-1 space-y-2 text-sm text-white/75">
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/50">Name</dt>
                    <dd className="font-medium text-white">{draft.name || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/50">Style</dt>
                    <dd className="capitalize">{draft.style}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/50">Ethnicity</dt>
                    <dd>{labelFromConfig(config, "ethnicity", draft.ethnicity) ?? "—"}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>
        );
      }

      default:
        return null;
    }
  }

  const shell = (
    <main
      className={cn(
        "relative overflow-x-hidden bg-black text-white",
        compact ? "min-h-0 pb-4" : "min-h-screen pb-32 md:pb-16 md:pt-8",
        mode === "fullscreen-preview" && "min-h-screen",
      )}
    >
      {!compact && (
        <div
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(236,72,153,0.12),transparent_55%)]"
          aria-hidden
        />
      )}

      <div
        className={cn(
          "relative mx-auto px-4 sm:px-6",
          device === "mobile" ? "max-w-[390px]" : compact ? "max-w-full" : "max-w-5xl",
        )}
      >
        <nav
          className={cn(
            "mb-8 flex items-center justify-center gap-1.5 sm:gap-2",
            compact && "mb-4",
          )}
          aria-label="Creation progress"
        >
          {activeSteps.map((s, index) => {
            const Icon = PROGRESS_ICONS[index % PROGRESS_ICONS.length] ?? User;
            const active = index === step;
            const done = index < step;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => !readOnly && index < step && setStep(index)}
                disabled={index > step || readOnly}
                className="flex flex-col items-center gap-0.5 disabled:cursor-default"
                aria-current={active ? "step" : undefined}
                title={s.label}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border transition-colors sm:h-9 sm:w-9",
                    active
                      ? "border-primary bg-primary/20 text-primary"
                      : done
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-white/15 bg-white/5 text-white/40",
                  )}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                  ) : (
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        <header className={cn("mb-6 text-center", compact ? "mb-4" : "md:mb-8")}>
          <h1 className={cn("font-bold tracking-tight", compact ? "text-xl" : "text-3xl sm:text-4xl")}>
            {mode === "edit" ? "Edit Your " : "Create Your "}
            <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              AI Girl
            </span>
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Step {step + 1} of {stepCount} — {currentStep.label}
          </p>
          {currentStep.description && (
            <p className="mt-1 text-xs text-white/45">{currentStep.description}</p>
          )}
        </header>

        <div className={cn("mb-6", !compact && "md:hidden")}>
          <CreatePortraitPreview draft={draft} config={config} />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">{renderStepContent(currentStep)}</div>
          {!compact && (
            <aside className="hidden shrink-0 lg:block lg:w-52 xl:w-56">
              <div className="sticky top-24">
                <CreatePortraitPreview draft={draft} config={config} />
              </div>
            </aside>
          )}
        </div>
      </div>

      {!hideFooter && !isPreview && (
        <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/95 px-4 py-3 backdrop-blur-md md:left-[88px]">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || submitting}
              className="text-white/70 hover:text-white"
            >
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
              Back
            </Button>
            {step < stepCount - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canAdvance()}
                className="h-11 rounded-full bg-gradient-to-r from-primary to-violet-600 px-8 text-sm font-semibold text-white"
              >
                Continue
                <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleCreate}
                disabled={!canAdvance() || submitting}
                className="h-11 rounded-full bg-gradient-to-r from-primary to-violet-600 px-8 text-sm font-semibold text-white"
              >
                {submitting
                  ? mode === "edit"
                    ? "Saving…"
                    : "Creating…"
                  : mode === "edit"
                    ? "Save Changes"
                    : "Create & Chat"}
              </Button>
            )}
          </div>
        </footer>
      )}
    </main>
  );

  return shell;
}
