"use client";

import { useState, useRef, KeyboardEvent, useCallback, useEffect } from "react";
import { Mic, Plus, Send, Smile } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatEmojiGifPanel } from "@/components/chat/chat-emoji-gif-panel";
import {
  ChatAttachmentSheet,
  type AttachmentMode,
} from "@/components/chat/chat-attachment-sheet";
import { ChatDictationPermission } from "@/components/chat/chat-dictation-permission";
import { useSpeechDictation } from "@/hooks/use-speech-dictation";
import { appendTranscriptToDraft } from "@/lib/speech/browser-speech-recognition";
import { cn } from "@/lib/utils";
import type { GalleryMediaType } from "@/types/gallery";

export type ChatSendOptions = {
  mediaType?: GalleryMediaType;
};

interface ChatInputProps {
  onSend: (content: string, options?: ChatSendOptions) => void;
  onSendGif?: (gifUrl: string) => void;
  characterName?: string;
  disabled?: boolean;
  placeholder?: string;
  onVoiceCall?: () => void;
  voiceCallEnabled?: boolean;
  variant?: "light" | "dark";
  value?: string;
  onValueChange?: (value: string) => void;
  mediaRequestEnabled?: boolean;
  mediaPaywallEnabled?: boolean;
  mediaCostPerItem?: number;
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
  characterName,
  disabled,
  placeholder = "Message Lucy...",
  variant = "light",
  value: controlledValue,
  onValueChange,
  mediaRequestEnabled = false,
  mediaPaywallEnabled = false,
  mediaCostPerItem = 0,
}: ChatInputProps) {
  const [internalValue, setInternalValue] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [attachmentSheetOpen, setAttachmentSheetOpen] = useState(false);
  const [attachmentMode, setAttachmentMode] = useState<AttachmentMode>(null);
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

  const dictation = useSpeechDictation({
    disabled,
    onFinalTranscript: (segment) => {
      setValue(appendTranscriptToDraft(valueRef.current, segment));
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
  });

  useEffect(() => {
    if (dictation.status === "unsupported") return;
    if (dictation.status === "error") {
      toast.error(
        dictation.errorKind === "network"
          ? "Voice input needs an internet connection."
          : "Could not capture speech. Try again.",
      );
    }
  }, [dictation.status, dictation.errorKind]);

  const displayValue =
    dictation.isListening && dictation.interimText
      ? appendTranscriptToDraft(value, dictation.interimText)
      : value;

  const mediaPlaceholder =
    attachmentMode === "video"
      ? "Describe the video you want..."
      : attachmentMode === "image"
        ? "Describe the photo you want..."
        : placeholder;

  const handleSend = () => {
    if (dictation.isListening) dictation.stop();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, attachmentMode ? { mediaType: attachmentMode } : undefined);
    setValue("");
    setPickerOpen(false);
    setAttachmentSheetOpen(false);
    setAttachmentMode(null);
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
      const textarea = textareaRef.current;
      if (!textarea) {
        setValue(value + emoji);
        return;
      }
      insertAtCursor(textarea, value, emoji, setValue);
    },
    [setValue, value],
  );

  const handleGifSelect = useCallback(
    (gifUrl: string) => {
      if (disabled || !onSendGif) return;
      onSendGif(gifUrl);
      setPickerOpen(false);
    },
    [disabled, onSendGif],
  );

  const togglePicker = () => {
    if (!pickerOpen) {
      setAttachmentSheetOpen(false);
      setAttachmentMode(null);
    }
    setPickerOpen((open) => !open);
  };

  const toggleAttachmentSheet = () => {
    if (!mediaRequestEnabled || !characterName) return;
    if (!attachmentSheetOpen) {
      setPickerOpen(false);
      setAttachmentMode(null);
    }
    setAttachmentSheetOpen((open) => !open);
  };

  const handleAttachmentSelect = (type: GalleryMediaType) => {
    setAttachmentMode(type);
    setAttachmentSheetOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const ghostBtnClass = cn(
    isDark && "text-white hover:bg-white/10 hover:text-white",
  );

  const emojiBtnActive = pickerOpen;
  const attachBtnActive = attachmentSheetOpen || attachmentMode !== null;

  return (
    <div
      className={cn(
        "border-t backdrop-blur-xl",
        isDark
          ? "border-white/10"
          : "border-border",
      )}
    >
      {pickerOpen && (
        <ChatEmojiGifPanel
          variant={variant}
          onEmojiSelect={handleEmojiSelect}
          onGifSelect={handleGifSelect}
        />
      )}
      {attachmentSheetOpen && mediaRequestEnabled && characterName && (
        <ChatAttachmentSheet
          characterName={characterName}
          variant={variant}
          disabled={disabled}
          paywallEnabled={mediaPaywallEnabled}
          costPerPhoto={mediaCostPerItem}
          onSelect={handleAttachmentSelect}
          onClose={() => setAttachmentSheetOpen(false)}
        />
      )}
      {(dictation.showPermissionPrompt || dictation.status === "denied") && (
        <div className="px-3 pt-2 sm:px-4">
          <ChatDictationPermission
            variant={variant}
            mode={
              dictation.status === "denied"
                ? "denied"
                : dictation.status === "requesting-permission"
                  ? "requesting"
                  : "prompt"
            }
            onAllow={dictation.confirmPermission}
            onCancel={dictation.dismissPermission}
          />
        </div>
      )}
      <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-4">
        <div
          className={cn(
            "mx-auto flex max-w-3xl items-end gap-1 rounded-[1.35rem] border p-1.5 sm:gap-1.5 sm:p-2",
            isDark
              ? "border-white/[0.08] bg-white/[0.04]"
              : "border-border bg-muted/30",
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
            {mediaRequestEnabled && characterName && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 shrink-0 rounded-full",
                  ghostBtnClass,
                  attachBtnActive &&
                    (isDark ? "bg-white/10 text-primary" : "bg-muted text-foreground"),
                )}
                aria-label={attachmentSheetOpen ? "Close attachments" : "Request photo or video"}
                aria-expanded={attachmentSheetOpen}
                disabled={disabled}
                onClick={toggleAttachmentSheet}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="relative flex min-w-0 flex-1 items-end">
            <Textarea
              ref={textareaRef}
              value={displayValue}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                dictation.isListening ? "Listening… speak your message" : mediaPlaceholder
              }
              disabled={disabled}
              readOnly={dictation.isListening}
              rows={1}
              className={cn(
                "min-h-[40px] max-h-32 min-w-0 flex-1 resize-none border-0 bg-transparent px-1 pr-1 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
                isDark && "text-white placeholder:text-white/40",
                dictation.isListening && "placeholder:text-primary/80",
              )}
              aria-label="Message input"
            />
          </div>
          {dictation.isSupported && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 shrink-0 rounded-full",
                ghostBtnClass,
                dictation.isListening &&
                  (isDark
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/25 hover:text-red-300"
                    : "bg-red-500/10 text-red-600 hover:bg-red-500/15"),
              )}
              aria-label={dictation.isListening ? "Stop voice input" : "Speak your message"}
              aria-pressed={dictation.isListening}
              disabled={disabled}
              onClick={() => dictation.toggle()}
            >
              <Mic className={cn("h-4 w-4", dictation.isListening && "animate-pulse")} />
            </Button>
          )}
          <Button
            size="icon"
            className={cn(
              "h-9 w-9 shrink-0 rounded-full",
              isDark
                ? "bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-white/10 disabled:text-white/30"
                : undefined,
            )}
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
