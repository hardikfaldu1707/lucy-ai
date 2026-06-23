"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Gem, ImageIcon, Plus, Sparkles, User, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  GENERATE_PRESETS,
  GENERATE_SLOTS,
  type GenerateMode,
} from "@/constants/generate-page";
import { ROUTES } from "@/constants/routes";
import { useFlag } from "@/hooks/use-flags";
import { cn } from "@/lib/utils";

function GenerateSlotButton({
  label,
  image,
  className,
  onClick,
}: {
  label: string;
  image: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-[#141414] text-left transition-colors hover:border-pink-500/40",
        className
      )}
    >
      <Image
        src={image}
        alt=""
        fill
        className="object-cover opacity-25 transition-opacity group-hover:opacity-35"
        sizes="(max-width: 768px) 50vw, 280px"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-white/30 bg-black/40 text-white/80 transition-colors group-hover:border-pink-400 group-hover:text-pink-300">
          <Plus className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <span className="text-sm font-semibold text-white/90">{label}</span>
      </div>
    </button>
  );
}

export function GeneratePage() {
  const [mode, setMode] = useState<GenerateMode>("video");
  const [preset, setPreset] = useState<string>(GENERATE_PRESETS[0].id);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const imageGenEnabled = useFlag("image_generation");

  // Admin can disable generation via the feature flag (signed-in users only).
  if (imageGenEnabled === false) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 text-center">
        <div className="max-w-md space-y-3">
          <Sparkles className="mx-auto h-10 w-10 text-fuchsia-400" aria-hidden />
          <h1 className="text-2xl font-bold text-white">Coming soon</h1>
          <p className="text-white/60">
            Image generation is currently disabled. Check back soon.
          </p>
        </div>
      </main>
    );
  }

  const selectCharacterHref = `${ROUTES.login}?${new URLSearchParams({
    from: "generate",
    mode,
    preset,
  }).toString()}`;

  const handleSlotClick = (slot: string) => {
    toast.message(`Add ${slot}`, {
      description: "Sign in to upload and generate custom scenes.",
    });
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-14 md:py-10">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(168,85,247,0.12),transparent_55%)]"
        aria-hidden
      />

      <div className="relative w-full max-w-xl">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111111] shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="flex flex-col items-center border-b border-white/5 px-6 pb-5 pt-8">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-500/30">
              <User className="h-8 w-8 text-white/90" strokeWidth={1.5} aria-hidden />
            </span>
            <h1 className="mt-4 text-xl font-bold text-white sm:text-2xl">Select Character</h1>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {/* Mode tabs + presets */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                className="inline-flex rounded-full border border-white/10 bg-black/40 p-1"
                role="tablist"
                aria-label="Generate mode"
              >
                {(
                  [
                    { id: "video" as const, label: "Video", icon: Video },
                    { id: "image" as const, label: "Image", icon: ImageIcon },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={mode === tab.id}
                    onClick={() => setMode(tab.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      mode === tab.id
                        ? "bg-white/10 text-white"
                        : "text-white/45 hover:text-white/70"
                    )}
                  >
                    <tab.icon className="h-4 w-4" aria-hidden />
                    {tab.label}
                    {tab.id === "image" && (
                      <Gem className="h-3.5 w-3.5 text-fuchsia-400" aria-hidden />
                    )}
                  </button>
                ))}
              </div>

              <Select value={preset} onValueChange={setPreset}>
                <SelectTrigger className="h-10 w-full rounded-xl border-white/10 bg-[#1a1a1a] text-white sm:w-[140px]">
                  <SelectValue placeholder="Presets" />
                </SelectTrigger>
                <SelectContent>
                  {GENERATE_PRESETS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Slot grid */}
            <div className="grid h-[min(52vw,280px)] grid-cols-2 grid-rows-2 gap-3 sm:h-[300px]">
              <GenerateSlotButton
                label={GENERATE_SLOTS.action.label}
                image={GENERATE_SLOTS.action.image}
                className="row-span-2 min-h-0"
                onClick={() => handleSlotClick("action")}
              />
              <GenerateSlotButton
                label={GENERATE_SLOTS.clothes.label}
                image={GENERATE_SLOTS.clothes.image}
                className="min-h-0"
                onClick={() => handleSlotClick("clothes")}
              />
              <GenerateSlotButton
                label={GENERATE_SLOTS.background.label}
                image={GENERATE_SLOTS.background.image}
                className="min-h-0"
                onClick={() => handleSlotClick("background")}
              />
            </div>

            {/* Advanced settings */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3">
              <Label htmlFor="advanced-settings" className="text-sm font-medium text-white/80">
                Advanced Settings
              </Label>
              <Switch
                id="advanced-settings"
                checked={advancedOpen}
                onCheckedChange={setAdvancedOpen}
                className="data-[state=checked]:bg-pink-500"
              />
            </div>

            {advancedOpen && (
              <div className="space-y-3 rounded-xl border border-white/10 bg-[#1a1a1a] p-4 text-sm text-white/60">
                <p>Higher quality exports, custom aspect ratio, and seed locking are available on Premium.</p>
                <Link href={ROUTES.pricing} className="font-medium text-pink-400 hover:text-pink-300">
                  View plans →
                </Link>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="border-t border-white/5 p-5 sm:p-6">
            <Button
              asChild
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 text-base font-semibold text-white shadow-lg shadow-pink-500/25 hover:from-pink-400 hover:via-fuchsia-400 hover:to-violet-400"
            >
              <Link href={selectCharacterHref}>
                <Sparkles className="mr-2 h-4 w-4" aria-hidden />
                Select Character
                <Gem className="ml-2 h-4 w-4 opacity-90" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
