"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
}: {
  title: string;
  description: string;
  levels: readonly { level: number; label: string; hint: string }[];
  value: ChatSettingsLevel;
  onChange: (level: ChatSettingsLevel) => void;
  disabled?: boolean;
  numericMobileLabels?: boolean;
}) {
  const active = levels.find((l) => l.level === value) ?? levels[2];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
      <div className="mb-2 sm:mb-3">
        <Label className="text-sm font-semibold text-white">{title}</Label>
        <p className="mt-1 hidden text-xs leading-relaxed text-white/50 sm:block">{description}</p>
      </div>
      <p className="mb-2 hidden text-xs text-pink-400/90 sm:mb-3 sm:block">
        <span className="font-semibold text-pink-400">{active.label}</span>
        <span className="text-white/40"> · {active.hint}</span>
      </p>
      <div className="grid grid-cols-5 gap-1">
        {levels.map((level) => {
          const selected = value === level.level;
          return (
            <button
              key={level.level}
              type="button"
              disabled={disabled}
              onClick={() => onChange(clampChatLevel(level.level))}
              className={cn(
                "rounded-xl px-0.5 py-2 text-center text-[10px] font-medium leading-tight transition-colors sm:px-1 sm:py-2.5 sm:text-[11px]",
                selected
                  ? "bg-pink-500 text-white shadow-sm shadow-pink-500/30"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
                disabled && "opacity-50",
              )}
              aria-pressed={selected}
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
          "border-white/15 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-pink-500",
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
            <DialogDescription className="hidden text-white/55 sm:block">
              Customize how <span className="font-medium text-white/80">{characterName}</span>{" "}
              chats with you.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-visible px-4 py-3 sm:min-h-0 sm:flex-1 sm:overflow-y-auto sm:overscroll-contain sm:px-6 sm:py-4">
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
                />

                <StepSetting
                  title="Response length"
                  description="How long her replies should be."
                  levels={RESPONSE_LENGTH_LEVELS}
                  value={draft.responseLength}
                  onChange={(responseLength) => updateDraft({ responseLength })}
                  disabled={saveMutation.isPending}
                  numericMobileLabels
                />

                {saveMutation.isPending && (
                  <p className="flex items-center justify-center gap-2 text-xs text-white/45">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                    Saving…
                  </p>
                )}

                <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  <div className="grid grid-cols-2 sm:block">
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
                  </div>
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
