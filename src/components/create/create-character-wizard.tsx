"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
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
import { CharacterAvatarPicker } from "@/components/admin/character-avatar-picker";
import {
  CREATE_PROGRESS_STEPS,
  CREATE_STYLES,
  type CreateStyle,
} from "@/constants/create-page";
import {
  CREATE_HAIR_COLORS,
  CREATE_HAIR_STYLES,
  CREATE_BODY_TYPES,
  CREATE_OUTFITS,
  labelForAppearance,
} from "@/constants/create-appearance";
import {
  CREATE_PERSONALITY_TRAITS,
  CREATE_RELATIONSHIP_TYPES,
} from "@/constants/create-personality";
import { CREATE_VOICE_OPTIONS, labelForVoice } from "@/constants/create-voices";
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
import { startChatWithCharacter } from "@/lib/chat/client";
import { cn } from "@/lib/utils";
import { useFlag } from "@/hooks/use-flags";

const PROGRESS_ICONS = [
  User,
  Sparkles,
  User,
  Sparkles,
  User,
  Heart,
  Mic,
  Camera,
  Heart,
] as const;

const STEP_COUNT = CREATE_PROGRESS_STEPS.length;

type AppearanceOption = { id: string; label: string; image: string | null };

function signInHrefForCreateWithDraft(): string {
  const params = new URLSearchParams({
    redirect_url: ROUTES.create,
    from: "create",
  });
  return `${ROUTES.login}?${params.toString()}`;
}

function OptionPreviewImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(!src);

  if (!src || failed) {
    return (
      <div
        className="absolute inset-0 bg-gradient-to-br from-pink-500/25 via-white/5 to-fuchsia-900/40"
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- optional local uploads; skip Next image optimizer
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover object-top"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function AppearanceGrid({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: AppearanceOption[];
  value: string;
  onChange: (id: string) => void;
  columns?: 2 | 3 | 4;
}) {
  const colClass =
    columns === 4
      ? "grid-cols-2 sm:grid-cols-4"
      : columns === 3
        ? "grid-cols-2 sm:grid-cols-3"
        : "grid-cols-2";

  return (
    <div className={cn("grid gap-3 sm:gap-4", colClass)}>
      {options.map((item) => {
        const selected = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "group relative overflow-hidden rounded-2xl text-left ring-2 transition-all",
              selected
                ? "ring-pink-500 shadow-[0_0_32px_-8px_rgba(236,72,153,0.5)]"
                : "ring-white/10 hover:ring-white/25",
            )}
            aria-pressed={selected}
          >
            <div className="relative aspect-[3/4] w-full">
              <OptionPreviewImage
                src={item.image}
                alt={item.label}
                sizes="(max-width: 640px) 45vw, 200px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              {selected && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg sm:h-7 sm:w-7">
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} aria-hidden />
                </span>
              )}
              <span
                className={cn(
                  "absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold sm:text-sm",
                  selected ? "bg-pink-500 text-white" : "bg-black/60 text-white/90",
                )}
              >
                {item.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function CreateCharacterWizard() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const canCreate = useFlag("user_created_characters");

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CreateCharacterDraft>(DEFAULT_CREATE_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const updateDraft = useCallback((patch: Partial<CreateCharacterDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      saveCreateDraft(next);
      return next;
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(loadCreateDraft());
    setHydrated(true);
  }, []);

  const runSubmit = useCallback(async () => {
    if (!isDraftReadyForSubmit(draft)) {
      toast.error("Complete all required fields first.");
      return;
    }
    setSubmitting(true);
    try {
      const { slug } = await submitUserCharacter(draftToPayload(draft));
      clearCreateDraft();
      toast.success("Your AI girl is ready!");
      const chatHref = await startChatWithCharacter(slug);
      router.push(chatHref);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  }, [draft, router]);

  useEffect(() => {
    if (!hydrated || !isLoaded || !isSignedIn) return;
    if (!shouldAutoSubmitCreate()) return;
    const loaded = loadCreateDraft();
    if (!isDraftReadyForSubmit(loaded)) return;

    void (async () => {
      setSubmitting(true);
      try {
        const { slug } = await submitUserCharacter(draftToPayload(loaded));
        clearCreateDraft();
        toast.success("Your AI girl is ready!");
        const chatHref = await startChatWithCharacter(slug);
        router.push(chatHref);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create");
      } finally {
        setSubmitting(false);
      }
    })();
  }, [hydrated, isLoaded, isSignedIn, router]);

  function toggleTrait(trait: string) {
    const next = draft.personality.includes(trait)
      ? draft.personality.filter((t) => t !== trait)
      : draft.personality.length < 5
        ? [...draft.personality, trait]
        : draft.personality;
    updateDraft({ personality: next });
  }

  async function previewVoice(voicePersonaId: string) {
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
      const { audioBase64, mime } = (await res.json()) as {
        audioBase64: string;
        mime: string;
      };
      if (audioRef.current) {
        audioRef.current.pause();
      }
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
    switch (step) {
      case 0:
        return true;
      case 1:
        return draft.hairStyle.length > 0 && draft.hairColor.length > 0;
      case 2:
        return draft.bodyType.length > 0;
      case 3:
        return draft.outfit.length > 0;
      case 4:
        return draft.name.trim().length > 0 && draft.age >= 18;
      case 5:
        return draft.personality.length > 0;
      case 6:
        return draft.voicePersonaId.length > 0;
      case 7:
        return draft.avatarUrl.trim().length > 0;
      case 8:
        return draft.relationship.length > 0;
      default:
        return false;
    }
  }

  function handleNext() {
    if (step < STEP_COUNT - 1) {
      setStep((s) => s + 1);
      return;
    }
    handleCreate();
  }

  function handleCreate() {
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

  if (canCreate === false) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-white">
        <p className="text-lg font-semibold">Character creation is unavailable</p>
        <p className="mt-2 text-sm text-white/60">
          This feature has been disabled. Browse existing companions instead.
        </p>
        <Button asChild className="mt-6 rounded-full bg-pink-500 hover:bg-pink-400">
          <a href={ROUTES.publicChatNew}>Browse companions</a>
        </Button>
      </div>
    );
  }

  return (
    <>
      <main className="relative min-h-screen overflow-x-hidden bg-black pb-32 text-white md:pb-16 md:pt-8">
        <div
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(236,72,153,0.12),transparent_55%)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          <nav
            className="mb-8 flex items-center justify-center gap-1.5 sm:mb-10 sm:gap-2"
            aria-label="Creation progress"
          >
            {CREATE_PROGRESS_STEPS.map((s, index) => {
              const Icon = PROGRESS_ICONS[index] ?? User;
              const active = index === step;
              const done = index < step;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => index < step && setStep(index)}
                  disabled={index > step}
                  className="flex flex-col items-center gap-0.5 disabled:cursor-default"
                  aria-current={active ? "step" : undefined}
                  title={s.label}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border transition-colors sm:h-9 sm:w-9",
                      active
                        ? "border-pink-500 bg-pink-500/20 text-pink-400"
                        : done
                          ? "border-pink-500/50 bg-pink-500/10 text-pink-300"
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

          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Create Your{" "}
              <span className="bg-gradient-to-r from-pink-400 to-fuchsia-400 bg-clip-text text-transparent">
                AI Girl
              </span>
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Step {step + 1} of {STEP_COUNT} — {CREATE_PROGRESS_STEPS[step]?.label}
            </p>
          </header>

          {step === 0 && (
            <section className="space-y-8">
              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                {CREATE_STYLES.map((item) => {
                  const selected = draft.style === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateDraft({ style: item.id as CreateStyle })}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl text-left ring-2 transition-all sm:rounded-3xl",
                        selected
                          ? "ring-pink-500 shadow-[0_0_32px_-8px_rgba(236,72,153,0.5)]"
                          : "ring-white/10 hover:ring-white/25",
                      )}
                      aria-pressed={selected}
                    >
                      <div className="relative aspect-[3/4] w-full">
                        <OptionPreviewImage
                          src={item.image}
                          alt={`${item.label} style`}
                          sizes="(max-width: 640px) 45vw, 320px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                        {selected && (
                          <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg">
                            <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                          </span>
                        )}
                        <span
                          className={cn(
                            "absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-5 py-1.5 text-sm font-semibold",
                            selected ? "bg-pink-500 text-white" : "bg-black/60 text-white/90",
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
          )}

          {step === 1 && (
            <section className="space-y-8">
              <div className="space-y-3">
                <p className="text-center text-sm font-medium text-white/80">Hair style</p>
                <AppearanceGrid
                  options={CREATE_HAIR_STYLES}
                  value={draft.hairStyle}
                  onChange={(id) => updateDraft({ hairStyle: id })}
                  columns={4}
                />
              </div>
              <div className="space-y-3">
                <p className="text-center text-sm font-medium text-white/80">Hair color</p>
                <AppearanceGrid
                  options={CREATE_HAIR_COLORS}
                  value={draft.hairColor}
                  onChange={(id) => updateDraft({ hairColor: id })}
                  columns={4}
                />
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <p className="text-center text-sm text-white/60">Choose her body type.</p>
              <AppearanceGrid
                options={CREATE_BODY_TYPES}
                value={draft.bodyType}
                onChange={(id) => updateDraft({ bodyType: id })}
                columns={3}
              />
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <p className="text-center text-sm text-white/60">Pick her usual outfit.</p>
              <AppearanceGrid
                options={CREATE_OUTFITS}
                value={draft.outfit}
                onChange={(id) => updateDraft({ outfit: id })}
                columns={4}
              />
            </section>
          )}

          {step === 4 && (
            <section className="mx-auto max-w-md space-y-5">
              <div className="space-y-2">
                <Label htmlFor="create-name" className="text-white/80">
                  Name
                </Label>
                <Input
                  id="create-name"
                  value={draft.name}
                  onChange={(e) => updateDraft({ name: e.target.value })}
                  placeholder="e.g. Luna"
                  className="border-white/15 bg-white/5 text-white"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-age" className="text-white/80">
                  Age
                </Label>
                <Input
                  id="create-age"
                  type="number"
                  min={18}
                  max={120}
                  value={draft.age}
                  onChange={(e) => updateDraft({ age: Number(e.target.value) || 18 })}
                  className="border-white/15 bg-white/5 text-white"
                />
              </div>
            </section>
          )}

          {step === 5 && (
            <section className="mx-auto max-w-lg space-y-5">
              <p className="text-center text-sm text-white/60">
                Pick up to 5 traits that define her personality.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {CREATE_PERSONALITY_TRAITS.map((trait) => {
                  const selected = draft.personality.includes(trait);
                  return (
                    <button
                      key={trait}
                      type="button"
                      onClick={() => toggleTrait(trait)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        selected
                          ? "bg-pink-500 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/15",
                      )}
                    >
                      {trait}
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
                />
              </div>
            </section>
          )}

          {step === 6 && (
            <section className="mx-auto max-w-lg space-y-4">
              <p className="text-center text-sm text-white/60">
                Choose her voice — tap to select, use preview to hear a sample.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {CREATE_VOICE_OPTIONS.map((voice) => {
                  const selected = draft.voicePersonaId === voice.id;
                  const loading = previewingVoice === voice.id;
                  return (
                    <div
                      key={voice.id}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border p-3 transition-colors",
                        selected
                          ? "border-pink-500 bg-pink-500/15"
                          : "border-white/10 bg-white/5",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => updateDraft({ voicePersonaId: voice.id })}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="text-sm font-semibold text-white">{voice.label}</p>
                        <p className="text-xs text-white/55">{voice.description}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => previewVoice(voice.id)}
                        disabled={loading}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-50"
                        aria-label={`Preview ${voice.label}`}
                      >
                        <Volume2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {step === 7 && (
            <section className="mx-auto max-w-lg space-y-5">
              <p className="text-center text-sm text-white/60">
                Upload a photo — required to create your AI girl.
              </p>
              <CharacterAvatarPicker
                value={draft.avatarUrl}
                onChange={(url) => updateDraft({ avatarUrl: url })}
                hidePresets
                variant="create"
                uploadScope="user"
              />
            </section>
          )}

          {step === 8 && (
            <section className="mx-auto max-w-lg space-y-6">
              <p className="text-center text-sm text-white/60">
                What is your relationship with her?
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {CREATE_RELATIONSHIP_TYPES.map((rel) => {
                  const selected = draft.relationship === rel;
                  return (
                    <button
                      key={rel}
                      type="button"
                      onClick={() => updateDraft({ relationship: rel })}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        selected
                          ? "bg-pink-500 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/15",
                      )}
                    >
                      {rel}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-semibold">Review</h2>
                <dl className="mt-3 space-y-2 text-sm text-white/75">
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/50">Name</dt>
                    <dd className="font-medium text-white">{draft.name || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/50">Age</dt>
                    <dd>{draft.age}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/50">Style</dt>
                    <dd className="capitalize">{draft.style}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/50">Photo</dt>
                    <dd>
                      {draft.avatarUrl ? (
                        <span className="text-pink-300">Uploaded</span>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/50">Hair</dt>
                    <dd className="text-right">
                      {[
                        labelForAppearance(CREATE_HAIR_STYLES, draft.hairStyle),
                        labelForAppearance(CREATE_HAIR_COLORS, draft.hairColor),
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/50">Body</dt>
                    <dd>
                      {labelForAppearance(CREATE_BODY_TYPES, draft.bodyType) ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/50">Outfit</dt>
                    <dd>
                      {labelForAppearance(CREATE_OUTFITS, draft.outfit) ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/50">Traits</dt>
                    <dd className="text-right">{draft.personality.join(", ") || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/50">Voice</dt>
                    <dd>{labelForVoice(draft.voicePersonaId) ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/50">Relationship</dt>
                    <dd>{draft.relationship || "—"}</dd>
                  </div>
                </dl>
              </div>
            </section>
          )}
        </div>
      </main>

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

          {step < STEP_COUNT - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canAdvance()}
              className="h-11 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 px-8 text-sm font-semibold"
            >
              Continue
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleCreate}
              disabled={!canAdvance() || submitting}
              className="h-11 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 px-8 text-sm font-semibold"
            >
              {submitting ? "Creating…" : "Create & Chat"}
            </Button>
          )}
        </div>
      </footer>
    </>
  );
}
