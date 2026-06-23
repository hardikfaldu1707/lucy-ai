"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { CoinBalanceBadge } from "@/components/shared/coin-balance-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { ROUTES } from "@/constants/routes";
import { isAllowedImageFile } from "@/lib/upload-client";
import { useProfile, useSetProfile } from "@/hooks/use-profile";
import type { ProfileQueryData } from "@/lib/profile/client";
import type { ProfileLanguage } from "@/lib/validation/schemas";

const PROFILE_LANGUAGES: ProfileLanguage[] = ["en", "es", "ja"];

function parseLanguage(value: string): ProfileLanguage {
  return PROFILE_LANGUAGES.includes(value as ProfileLanguage) ? (value as ProfileLanguage) : "en";
}

const NOTIFICATIONS = [
  { key: "notifyPush" as const, label: "New messages" },
  { key: "notifyEmail" as const, label: "Memory updates" },
  { key: "notifyMarketing" as const, label: "Product updates" },
];

function applyQueryToForm(
  data: ProfileQueryData,
  userImageUrl: string | undefined,
  setters: {
    setUsername: (v: string) => void;
    setAvatarUrl: (v: string | null) => void;
    setLanguage: (v: ProfileLanguage) => void;
    setNotifyEmail: (v: boolean) => void;
    setNotifyPush: (v: boolean) => void;
    setNotifyMarketing: (v: boolean) => void;
  },
) {
  setters.setUsername(data.profile.username?.trim() ?? "");
  setters.setAvatarUrl(data.profile.avatarUrl ?? userImageUrl ?? null);
  setters.setLanguage(parseLanguage(data.settings.language));
  setters.setNotifyEmail(data.settings.notifyEmail);
  setters.setNotifyPush(data.settings.notifyPush);
  setters.setNotifyMarketing(data.settings.notifyMarketing);
}

export default function ProfilePage() {
  const { user } = useUser();
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const setProfileCache = useSetProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [language, setLanguage] = useState<ProfileLanguage>("en");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyMarketing, setNotifyMarketing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const loading = profileLoading && !profileData;

  const revokePreview = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    if (!profileData) return;
    applyQueryToForm(profileData, user?.imageUrl, {
      setUsername,
      setAvatarUrl,
      setLanguage,
      setNotifyEmail,
      setNotifyPush,
      setNotifyMarketing,
    });
  }, [profileData, user?.imageUrl]);

  useEffect(() => {
    return () => revokePreview(previewUrl);
  }, [previewUrl, revokePreview]);

  function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!isAllowedImageFile(file)) {
      toast.error("Please upload a supported image (JPEG, PNG, WebP, or GIF).");
      return;
    }

    revokePreview(previewUrl);
    setPendingAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!user) return;

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      toast.error("Username is required.");
      return;
    }

    setSaving(true);
    try {
      let nextAvatarUrl: string | undefined;

      if (pendingAvatarFile) {
        await user.setProfileImage({ file: pendingAvatarFile });
        await user.reload();
        nextAvatarUrl = user.imageUrl;
      }

      const body: Record<string, unknown> = {
        username: trimmedUsername,
        language,
        notifyEmail,
        notifyPush,
        notifyMarketing,
      };
      if (nextAvatarUrl) body.avatarUrl = nextAvatarUrl;

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Failed to save profile");
      }

      const data = (await res.json()) as ProfileQueryData;

      setProfileCache(data);
      applyQueryToForm(data, nextAvatarUrl ?? user.imageUrl, {
        setUsername,
        setAvatarUrl,
        setLanguage,
        setNotifyEmail,
        setNotifyPush,
        setNotifyMarketing,
      });

      revokePreview(previewUrl);
      setPreviewUrl(null);
      setPendingAvatarFile(null);

      try {
        await user.reload();
      } catch {
        // DB + query cache already updated; Clerk reload is optional.
      }

      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  const displayAvatar = previewUrl ?? avatarUrl ?? user?.imageUrl;

  return (
    <div className="space-y-8">
      <PageHeader title="Profile" description="Manage your public profile and preferences." />
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Wallet</CardTitle>
            <CardDescription>Your coin balance for chat and features</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <CoinBalanceBadge variant="card" className="text-base" />
            <Button variant="outline" size="sm" asChild>
              <Link href={ROUTES.subscriptionCoins}>Get more coins</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-muted">
              {displayAvatar ? (
                previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={displayAvatar}
                    alt="Avatar"
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                )
              ) : null}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarPick}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={loading || saving}
              onClick={() => fileInputRef.current?.click()}
            >
              Change avatar
            </Button>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading || saving}
                maxLength={40}
                placeholder="Set your display name"
              />
              <p className="text-xs text-muted-foreground">
                Shown across the app. You can set this even if you did not pick a username at sign-up.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={language}
                onValueChange={(v) => setLanguage(v as ProfileLanguage)}
                disabled={loading || saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={loading || saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Notification settings</CardTitle>
          <CardDescription>Choose what you want to be notified about</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {NOTIFICATIONS.map((n) => {
            const checked =
              n.key === "notifyEmail"
                ? notifyEmail
                : n.key === "notifyPush"
                  ? notifyPush
                  : notifyMarketing;
            const onCheckedChange =
              n.key === "notifyEmail"
                ? setNotifyEmail
                : n.key === "notifyPush"
                  ? setNotifyPush
                  : setNotifyMarketing;

            return (
              <div key={n.label} className="flex items-center justify-between">
                <Label>{n.label}</Label>
                <Switch
                  checked={checked}
                  onCheckedChange={onCheckedChange}
                  disabled={loading || saving}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
