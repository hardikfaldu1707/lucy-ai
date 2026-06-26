import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
};

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", DATE_FORMAT);
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const CHAT_TIME: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function formatChatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffDays = Math.floor((startOfDay(now) - startOfDay(d)) / 86400000);

  const time = d.toLocaleTimeString(undefined, CHAT_TIME);

  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7) {
    const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
    return `${weekday} ${time}`;
  }
  const datePart = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${datePart}, ${time}`;
}

/** Short time for inside message bubbles (WhatsApp-style). */
export function formatBubbleTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString(undefined, CHAT_TIME);
}

/** Compact time for chat sidebar rows (today = time only, else short date). */
export function formatChatListTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffDays = Math.floor((startOfDay(now) - startOfDay(d)) / 86400000);

  if (diffDays === 0) return d.toLocaleTimeString(undefined, CHAT_TIME);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatChatDateLabel(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffDays = Math.floor((startOfDay(now) - startOfDay(d)) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function chatDateKey(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
