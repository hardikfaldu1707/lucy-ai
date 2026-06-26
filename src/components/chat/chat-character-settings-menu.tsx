"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as SliderPrimitive from "@radix-ui/react-slider";
import {
  Coins,
  Flag,
  Loader2,
  Phone,
  Settings,
  Trash2,
  UserRound,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { chatSettingsSheetClass } from "@/components/chat/chat-header-actions";
import { DeleteChatDialog } from "@/components/chat/delete-chat-dialog";
import { ReportDialog } from "@/components/report/report-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clampChatLevel,
  DEFAULT_CHARACTER_CHAT_PREFS,
  LUST_LEVELS,
  RESPONSE_LENGTH_LEVELS,
  type CharacterChatPrefs,
  type ChatSettingsLevel,
} from "@/constants/chat-settings";
import { CREATE_VOICE_OPTIONS } from "@/constants/create-voices";
import { characterProfilePath, ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const LUST_EMOJIS = ["🤖", "🙂", "😊", "😉", "🔥"] as const;

const SLIDER_STEPS: ChatSettingsLevel[] = [1, 2, 3, 4, 5];

function ChatSettingsSlider({
  value,
  onChange,
  disabled,
  variant,
  label,
}: {
  value: ChatSettingsLevel;
  onChange: (level: ChatSettingsLevel) => void;
  disabled?: boolean;
  variant: "lust" | "response";
  label: string;
}) {
  return (
    <div className="relative px-1 py-2">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-1 top-1/2 h-[9px] -translate-y-1/2 rounded-full",
          variant === "lust"
            ? "bg-gradient-to-r from-[#22d3ee] via-[#fbbf24] to-[#ef4444]"
            : "bg-gradient-to-r from-[#df1a97] via-[#e11d8f] to-[#ef4444]",
        )}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-x-1 top-1/2 flex -translate-y-1/2 justify-between"
        aria-hidden
      >
        {SLIDER_STEPS.map((step) => (
          <span
            key={step}
            className="h-2 w-2 rounded-full border-[1.5px] border-white/95 bg-black/20"
          />
        ))}
      </div>

      <SliderPrimitive.Root
        className="relative z-[2] flex w-full touch-none select-none items-center py-2"
        min={1}
        max={5}
        step={1}
        value={[value]}
        disabled={disabled}
        onValueChange={([next]) => onChange(clampChatLevel(next))}
        aria-label={label}
      >
        <SliderPrimitive.Track className="relative h-[9px] w-full grow rounded-full bg-transparent">
          <SliderPrimitive.Range className="absolute h-full opacity-0" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#101010] shadow-[0_4px_14px_rgba(0,0,0,0.55)]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#df1a97]/70 focus-visible:ring-offset-0",
            disabled && "opacity-50",
          )}
        >
          <span className="flex gap-[3px]" aria-hidden>
            <span className="h-3 w-[2px] rounded-full bg-white/75" />
            <span className="h-3 w-[2px] rounded-full bg-white/75" />
            <span className="h-3 w-[2px] rounded-full bg-white/75" />
          </span>
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>
    </div>
  );
}

interface ChatSettingsResponse extends CharacterChatPrefs {
  effectiveVoicePersonaId: string | null;
  characterVoiceId: string | null;
  owned: boolean;
}

interface ChatCharacterSettingsMenuProps {
  conversationId: string;
  characterSlug: string;
  characterName: string;
  voiceEnabled?: boolean;
  voiceHref?: string;
  triggerClassName?: string;
}

async function fetchChatSettings(conversationId: string): Promise<ChatSettingsResponse> {
  const res = await fetch(`/api/chat/${conversationId}/settings`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load chat settings");
  return res.json() as Promise<ChatSettingsResponse>;
}

async function saveChatSettings(
  conversationId: string,
  patch: Partial<CharacterChatPrefs>,
): Promise<ChatSettingsResponse> {
  const res = await fetch(`/api/chat/${conversationId}/settings`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to save settings");
  }
  return res.json() as Promise<ChatSettingsResponse>;
}

function StepSetting({
  title,
  description,
  levels,
  value,
  onChange,
  disabled,
  numericMobileLabels,
  variant,
  emojis,
}: {
  title: string;
  description: string;
  levels: readonly { level: number; label: string; hint: string }[];
  value: ChatSettingsLevel;
  onChange: (level: ChatSettingsLevel) => void;
  disabled?: boolean;
  numericMobileLabels?: boolean;
  variant: "lust" | "response";
  emojis?: readonly string[];
}) {
  const active = levels.find((l) => l.level === value) ?? levels[2];
  const activeIndex = Math.max(0, levels.findIndex((l) => l.level === value));

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2">
        <Label className="text-sm font-semibold text-white">{title}</Label>
        <p className="mt-1 text-xs leading-relaxed text-white/50">{description}</p>
      </div>
      <p className="mb-3 text-xs">
        <span className="font-semibold text-[#df1a97]">{active.label}</span>
        <span className="text-white/45"> · {active.hint}</span>
      </p>

      {emojis && (
        <div className="mb-1 flex justify-between px-2">
          {emojis.map((emoji, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={`${emoji}-${index}`}
                type="button"
                disabled={disabled}
                onClick={() => onChange(clampChatLevel((index + 1) as ChatSettingsLevel))}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-[22px] leading-none transition-all",
                  selected
                    ? "bg-amber-400/15 ring-1 ring-amber-300/25"
                    : "opacity-30 grayscale",
                )}
                aria-label={`${title}: ${levels[index]?.label ?? index + 1}`}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      )}

      <ChatSettingsSlider
        value={value}
        onChange={onChange}
        disabled={disabled}
        variant={variant}
        label={title}
      />

      <div className="mt-1 grid grid-cols-5 gap-1.5">
        {levels.map((level) => {
          const selected = value === level.level;
          return (
            <button
              key={level.level}
              type="button"
              disabled={disabled}
              onClick={() => onChange(clampChatLevel(level.level))}
              className={cn(
                "rounded-full px-0.5 py-2 text-center text-[10px] font-medium leading-tight transition-colors sm:py-2.5 sm:text-[11px]",
                selected
                  ? "bg-[#df1a97] text-white shadow-sm shadow-[#df1a97]/35"
                  : "bg-white/[0.06] text-white/55 hover:bg-white/10 hover:text-white/80",
                disabled && "opacity-50",
              )}
              aria-pressed={selected ? "true" : "false"}
              aria-label={`${title}: ${level.label}`}
            >
              {numericMobileLabels ? (
                <>
                  <span className="sm:hidden">{level.level}</span>
                  <span className="hidden sm:inline">{level.label}</span>
                </>
              ) : (
                level.label
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  onClick,
  href,
  destructive,
  compact,
  className: extraClassName,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: React.ReactNode;
  onClick?: () => void;
  href?: string;
  destructive?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const className = cn(
    "flex w-full items-center gap-2 rounded-xl px-2.5 text-left font-medium transition-colors sm:gap-3 sm:px-3",
    compact ? "py-2 text-xs sm:py-3 sm:text-sm" : "py-3 text-sm",
    destructive
      ? "text-red-400 hover:bg-red-500/10"
      : "text-white/85 hover:bg-white/10 hover:text-white",
    extraClassName,
  );

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  );
}

export function ChatCharacterSettingsMenu({
  conversationId,
  characterSlug,
  characterName,
  voiceEnabled,
  voiceHref,
  triggerClassName,
}: ChatCharacterSettingsMenuProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteChatOpen, setDeleteChatOpen] = useState(false);
  const [deleteCharacterOpen, setDeleteCharacterOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState(false);
  const [draftOverrides, setDraftOverrides] = useState<Partial<CharacterChatPrefs>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["chat-settings", conversationId],
    queryFn: () => fetchChatSettings(conversationId),
    enabled: open,
    staleTime: 30_000,
  });

  const handleSettingsOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setDraftOverrides({});
  }, []);

  const serverPrefs: CharacterChatPrefs = data ?? DEFAULT_CHARACTER_CHAT_PREFS;
  const draft: CharacterChatPrefs = {
    lustLevel: draftOverrides.lustLevel ?? serverPrefs.lustLevel,
    responseLength: draftOverrides.responseLength ?? serverPrefs.responseLength,
    voicePersonaId:
      draftOverrides.voicePersonaId !== undefined
        ? draftOverrides.voicePersonaId
        : serverPrefs.voicePersonaId,
  };

  const saveMutation = useMutation({
    mutationFn: (patch: Partial<CharacterChatPrefs>) =>
      saveChatSettings(conversationId, patch),
    onSuccess: (saved) => {
      queryClient.setQueryData(["chat-settings", conversationId], saved);
      setDraftOverrides({});
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteCharacter = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/characters/${encodeURIComponent(characterSlug)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Failed to delete character");
      }
    },
    onSuccess: async () => {
      toast.success(`${characterName} deleted`);
      setDeleteCharacterOpen(false);
      handleSettingsOpenChange(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-girls"] }),
        queryClient.invalidateQueries({ queryKey: ["chat-browse", "characters"] }),
        queryClient.invalidateQueries({ queryKey: ["public-chat", "conversations"] }),
      ]);
      router.push(ROUTES.publicChat);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const queueSave = useCallback(
    (patch: Partial<CharacterChatPrefs>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveMutation.mutate(patch);
      }, 350);
    },
    [saveMutation],
  );

  const updateDraft = useCallback(
    (patch: Partial<CharacterChatPrefs>) => {
      setDraftOverrides((prev) => ({ ...prev, ...patch }));
      queueSave(patch);
    },
    [queueSave],
  );

  async function previewVoice(voicePersonaId: string) {
    if (previewingVoice) return;
    setPreviewingVoice(true);
    try {
      const res = await fetch("/api/voice/preview", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voicePersonaId }),
      });
      if (!res.ok) throw new Error("Preview failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch {
      toast.error("Could not preview voice");
    } finally {
      setPreviewingVoice(false);
    }
  }

  const voiceValue = draft.voicePersonaId ?? "__default__";

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        aria-label={`${characterName} chat settings`}
        className={cn(
          "border-white/15 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary",
          triggerClassName,
        )}
        onClick={() => handleSettingsOpenChange(true)}
      >
        <Settings className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={handleSettingsOpenChange}>
        <DialogContent className={chatSettingsSheetClass}>
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20 sm:hidden" aria-hidden />

          <DialogHeader className="space-y-1 border-b border-white/10 px-4 py-3 text-left sm:px-6 sm:pb-4 sm:pt-6">
            <DialogTitle className="text-base text-white sm:text-lg">Chat settings</DialogTitle>
            <DialogDescription className="text-sm text-white/55">
              Customize how <span className="font-medium text-white/80">{characterName}</span>{" "}
              chats with you.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-visible px-4 py-3 sm:min-h-0 sm:flex-1 sm:overflow-y-auto sm:overscroll-contain sm:px-6 sm:py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {isLoading && !data ? (
              <div className="flex items-center justify-center py-12 text-white/50">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:block">
                    <Label className="shrink-0 text-sm font-semibold text-white sm:mb-1">
                      Voice
                    </Label>
                    <div className="flex min-w-0 flex-1 gap-2">
                      <Select
                        value={voiceValue}
                        onValueChange={(v) =>
                          updateDraft({ voicePersonaId: v === "__default__" ? null : v })
                        }
                        disabled={saveMutation.isPending}
                      >
                        <SelectTrigger className="h-10 flex-1 border-white/15 bg-white/5 text-white sm:h-11">
                          <SelectValue placeholder="Choose a voice" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__default__">Character default</SelectItem>
                          {CREATE_VOICE_OPTIONS.map((voice) => (
                            <SelectItem key={voice.id} value={voice.id}>
                              {voice.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0 border-white/15 bg-white/5 text-white hover:bg-white/10 sm:h-11 sm:w-11"
                        disabled={voiceValue === "__default__" || previewingVoice}
                        onClick={() => {
                          if (voiceValue !== "__default__") void previewVoice(voiceValue);
                        }}
                        aria-label="Preview voice"
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 hidden text-xs text-white/50 sm:block">
                    Pick how she sounds in voice messages and calls.
                  </p>
                </section>

                <StepSetting
                  title="Lust level"
                  description="How flirty and intense she feels."
                  levels={LUST_LEVELS}
                  value={draft.lustLevel}
                  onChange={(lustLevel) => updateDraft({ lustLevel })}
                  disabled={saveMutation.isPending}
                  variant="lust"
                  emojis={LUST_EMOJIS}
                />

                <StepSetting
                  title="Response length"
                  description="How long her replies should be."
                  levels={RESPONSE_LENGTH_LEVELS}
                  value={draft.responseLength}
                  onChange={(responseLength) => updateDraft({ responseLength })}
                  disabled={saveMutation.isPending}
                  numericMobileLabels
                  variant="response"
                />
                {saveMutation.isPending && (
                  <p className="flex items-center justify-center gap-2 text-xs text-white/45">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                    Saving…
                  </p>
                )}

                <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                  <SettingsRow
                    compact
                    icon={Coins}
                    label="Get coins"
                    href={ROUTES.subscriptionCoins}
                    onClick={() => handleSettingsOpenChange(false)}
                  />
                  <SettingsRow
                    compact
                    icon={UserRound}
                    label={
                      <>
                        <span className="sm:hidden">View profile</span>
                        <span className="hidden sm:inline">{`View ${characterName}'s profile`}</span>
                      </>
                    }
                    href={characterProfilePath(characterSlug)}
                    onClick={() => handleSettingsOpenChange(false)}
                  />
                  {voiceEnabled && voiceHref && (
                    <SettingsRow
                      compact
                      icon={Phone}
                      label="Voice call"
                      href={voiceHref}
                      onClick={() => handleSettingsOpenChange(false)}
                    />
                  )}
                  <SettingsRow
                    compact
                    icon={Flag}
                    label="Report"
                    onClick={() => setReportOpen(true)}
                  />
                  <SettingsRow
                    compact
                    icon={Trash2}
                    label="Delete chat"
                    onClick={() => setDeleteChatOpen(true)}
                    destructive
                  />
                  {data?.owned && (
                    <SettingsRow
                      compact
                      icon={Trash2}
                      label={`Delete ${characterName}`}
                      onClick={() => setDeleteCharacterOpen(true)}
                      destructive
                    />
                  )}
                </section>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DeleteChatDialog
        conversationId={conversationId}
        characterName={characterName}
        open={deleteChatOpen}
        onOpenChange={setDeleteChatOpen}
        hideTrigger
        onDeleted={() => handleSettingsOpenChange(false)}
      />

      <ReportDialog
        conversationId={conversationId}
        open={reportOpen}
        onOpenChange={setReportOpen}
        hideTrigger
      />

      <Dialog open={deleteCharacterOpen} onOpenChange={setDeleteCharacterOpen}>
        <DialogContent className="border-white/10 bg-[#121212] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete AI girl</DialogTitle>
            <DialogDescription className="text-white/60">
              Permanently delete{" "}
              <span className="font-semibold text-white">{characterName}</span>? All chats,
              messages, and memories will be removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="border-white/15 bg-transparent text-white hover:bg-white/10"
              onClick={() => setDeleteCharacterOpen(false)}
              disabled={deleteCharacter.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteCharacter.mutate()}
              disabled={deleteCharacter.isPending}
            >
              {deleteCharacter.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
