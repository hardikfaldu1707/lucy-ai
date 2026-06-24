"use client";

import { useState, useRef, KeyboardEvent, useCallback, useEffect, useMemo } from "react";
import { AudioLines, Mic, Plus, Send, Smile } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatEmojiGifPanel } from "@/components/chat/chat-emoji-gif-panel";
import { ChatSendPhotoPanel } from "@/components/chat/chat-send-photo-panel";
import { ChatDictationPermission } from "@/components/chat/chat-dictation-permission";
import { useSpeechDictation } from "@/hooks/use-speech-dictation";
import { appendTranscriptToDraft } from "@/lib/speech/browser-speech-recognition";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string) => void;
  onSendGif?: (gifUrl: string) => void;
  onSendCharacterPhoto?: (photoIndex: number) => Promise<void>;
  characterSlug?: string;
  characterName?: string;
  disabled?: boolean;
  placeholder?: string;
  onVoiceCall?: () => void;
  voiceCallEnabled?: boolean;
  variant?: "light" | "dark";
  value?: string;
  onValueChange?: (value: string) => void;
}

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  current: string,
  insert: string,
  setValue: (next: string) => void,
) {
  const start = textarea.selectionStart ?? current.length;
  const end = textarea.selectionEnd ?? current.length;
  const next = current.slice(0, start) + insert + current.slice(end);
  setValue(next);
  requestAnimationFrame(() => {
    textarea.focus();
    const pos = start + insert.length;
    textarea.setSelectionRange(pos, pos);
  });
}

export function ChatInput({
  onSend,
  onSendGif,
  onSendCharacterPhoto,
  characterSlug,
  characterName,
  disabled,
  placeholder = "Message Lucy...",
  onVoiceCall,
  voiceCallEnabled,
  variant = "light",
  value: controlledValue,
  onValueChange,
}: ChatInputProps) {
  const [internalValue, setInternalValue] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [photoPanelOpen, setPhotoPanelOpen] = useState(false);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const setValue = useCallback(
    (next: string) => {
      if (isControlled) onValueChange?.(next);
      else setInternalValue(next);
    },
    [isControlled, onValueChange],
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(value);
  const isDark = variant === "dark";

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const onFinalTranscript = useCallback(
    (segment: string) => {
      setValue(appendTranscriptToDraft(valueRef.current, segment));
    },
    [setValue],
  );

  const dictation = useSpeechDictation({
    onFinalTranscript,
    disabled,
  });

  const displayValue = useMemo(() => {
    if (!dictation.isListening || !dictation.interimText) return value;
    return appendTranscriptToDraft(value, dictation.interimText);
  }, [dictation.interimText, dictation.isListening, value]);

  const { status: dictationStatus, errorKind: dictationErrorKind, stop: stopDictation } = dictation;

  useEffect(() => {
    if (dictationStatus === "unsupported") {
      toast.error("Voice typing isn't supported in this browser. Try Chrome or Safari.");
      stopDictation();
    }
  }, [dictationStatus, stopDictation]);

  useEffect(() => {
    if (dictationStatus !== "error") return;
    toast.error(
      dictationErrorKind === "network"
        ? "Voice typing needs an internet connection. Check your network and try again."
        : "Voice typing failed. Please try again.",
    );
    stopDictation();
  }, [dictationStatus, dictationErrorKind, stopDictation]);

  const handleSend = () => {
    dictation.stop();
    const trimmed = displayValue.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    setPickerOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      dictation.stop();
      const textarea = textareaRef.current;
      if (!textarea) {
        setValue(value + emoji);
        return;
      }
      insertAtCursor(textarea, value, emoji, setValue);
    },
    [dictation, setValue, value],
  );

  const handleGifSelect = useCallback(
    (gifUrl: string) => {
      if (disabled || !onSendGif) return;
      dictation.stop();
      onSendGif(gifUrl);
      setPickerOpen(false);
    },
    [dictation, disabled, onSendGif],
  );

  const togglePicker = () => {
    if (!pickerOpen) {
      dictation.stop();
      setPhotoPanelOpen(false);
    }
    setPickerOpen((open) => !open);
  };

  const togglePhotoPanel = () => {
    if (!onSendCharacterPhoto || !characterSlug) return;
    if (!photoPanelOpen) {
      dictation.stop();
      setPickerOpen(false);
    }
    setPhotoPanelOpen((open) => !open);
  };

  const handleVoiceCallClick = () => {
    if (!onVoiceCall) return;
    dictation.stop();
    setPickerOpen(false);
    setPhotoPanelOpen(false);
    if (!voiceCallEnabled) {
      toast.error("Voice calls are not available right now. Check admin settings or OPENROUTER_API_KEY.");
      return;
    }
    onVoiceCall();
  };

  const handleDictationToggle = () => {
    if (!dictation.isSupported) {
      toast.error("Voice typing isn't supported in this browser. Try Chrome or Safari.");
      return;
    }
    if (dictation.status === "denied") {
      dictation.confirmPermission();
      return;
    }
    dictation.toggle();
  };

  const handleTextareaChange = (next: string) => {
    if (dictation.isListening) dictation.stop();
    setValue(next);
  };

  const ghostBtnClass = cn(
    isDark && "text-white hover:bg-white/10 hover:text-white",
  );

  const voiceBtnClass = cn(
    ghostBtnClass,
    voiceCallEnabled &&
      isDark &&
      "text-primary hover:bg-primary/20 hover:text-primary",
  );

  const emojiBtnActive = pickerOpen;
  const photoBtnActive = photoPanelOpen;
  const dictationActive = dictation.isListening;
  const photoFeatureEnabled = Boolean(onSendCharacterPhoto && characterSlug && characterName);

  const permissionMode =
    dictation.status === "requesting-permission"
      ? "requesting"
      : dictation.status === "denied"
        ? "denied"
        : "prompt";

  const showPermissionBar =
    dictation.showPermissionPrompt || dictation.status === "denied";

  return (
    <div
      className={cn(
        "border-t backdrop-blur-xl",
        isDark
          ? "border-white/10 bg-[#0a0a0a]/95"
          : "border-border bg-background/80",
      )}
    >
      {pickerOpen && (
        <ChatEmojiGifPanel
          variant={variant}
          onEmojiSelect={handleEmojiSelect}
          onGifSelect={handleGifSelect}
        />
      )}
      {photoPanelOpen && photoFeatureEnabled && (
        <ChatSendPhotoPanel
          characterSlug={characterSlug!}
          characterName={characterName!}
          variant={variant}
          disabled={disabled}
          onPhotoSent={onSendCharacterPhoto!}
          onClose={() => setPhotoPanelOpen(false)}
        />
      )}
      <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-4">
        {showPermissionBar && (
          <ChatDictationPermission
            variant={variant}
            mode={permissionMode}
            onAllow={dictation.confirmPermission}
            onCancel={dictation.dismissPermission}
          />
        )}
        <div
          className={cn(
            "mx-auto flex max-w-3xl items-end gap-1 rounded-[1.35rem] border p-1.5 sm:gap-1.5 sm:p-2",
            isDark
              ? "border-white/[0.08] bg-white/[0.04]"
              : "border-border bg-muted/30",
            dictationActive && isDark && "border-primary/25",
            dictationActive && !isDark && "border-primary/30",
          )}
        >
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 shrink-0 rounded-full",
                ghostBtnClass,
                emojiBtnActive &&
                  (isDark ? "bg-white/10 text-primary" : "bg-muted text-foreground"),
              )}
              aria-label={pickerOpen ? "Close emoji picker" : "Open emoji picker"}
              aria-expanded={pickerOpen}
              disabled={disabled}
              onClick={togglePicker}
            >
              <Smile className="h-4 w-4" />
            </Button>
            {onVoiceCall && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 shrink-0 rounded-full",
                  voiceBtnClass,
                  !voiceCallEnabled && "opacity-45",
                )}
                aria-label="Voice call"
                disabled={disabled}
                onClick={handleVoiceCallClick}
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}
            {photoFeatureEnabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 shrink-0 rounded-full",
                  ghostBtnClass,
                  photoBtnActive &&
                    (isDark ? "bg-white/10 text-primary" : "bg-muted text-foreground"),
                )}
                aria-label={photoPanelOpen ? "Close send photo" : "Send a photo"}
                aria-expanded={photoPanelOpen}
                disabled={disabled}
                onClick={togglePhotoPanel}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="relative flex min-w-0 flex-1 items-end">
            <Textarea
              ref={textareaRef}
              value={displayValue}
              onChange={(e) => handleTextareaChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                dictationActive ? "Listening… speak your message" : placeholder
              }
              disabled={disabled}
              rows={1}
              className={cn(
                "min-h-[40px] max-h-32 min-w-0 flex-1 resize-none border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
                dictation.isSupported ? "pr-10" : "pr-1",
                isDark && "text-white placeholder:text-white/40",
              )}
              aria-label="Message input"
            />
            {dictation.isSupported && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute bottom-0.5 right-0 h-8 w-8 shrink-0 rounded-full",
                  isDark
                    ? "text-white/70 hover:bg-white/10 hover:text-white"
                    : "text-muted-foreground hover:text-foreground",
                  dictationActive &&
                    (isDark
                      ? "bg-primary/20 text-primary"
                      : "bg-primary/10 text-primary"),
                )}
                aria-label={
                  dictationActive ? "Stop voice typing" : "Speak to type"
                }
                aria-pressed={dictationActive}
                disabled={disabled}
                onClick={handleDictationToggle}
              >
                <AudioLines className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            size="icon"
            className={cn(
              "h-9 w-9 shrink-0 rounded-full",
              isDark
                ? "bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-white/10 disabled:text-white/30"
                : undefined,
            )}
            onClick={handleSend}
            disabled={disabled || !displayValue.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
