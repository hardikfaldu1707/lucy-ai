import { cn } from "@/lib/utils";

/** Shared icon-button styling for the chat profile bar. */
export const chatHeaderIconClass = cn(
  "h-9 w-9 shrink-0 rounded-xl border-white/15 bg-white/5 text-white",
  "hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary",
);

export const chatSettingsSheetClass = cn(
  "flex h-auto max-h-[92dvh] flex-col gap-0 overflow-hidden border-white/10 bg-[#121212] p-0 text-white",
  "pb-[env(safe-area-inset-bottom)]",
  "fixed inset-x-0 bottom-0 top-auto w-full max-w-none",
  "translate-x-0 translate-y-0 rounded-b-none rounded-t-3xl",
  "sm:inset-auto sm:left-[50%] sm:top-[50%] sm:max-h-[90dvh] sm:max-w-md sm:pb-0",
  "sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl",
);
