"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, ExternalLink, Trash2, HardDrive, Image, Video, FolderOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AdminTableHead,
  AdminTableScroll,
  AdminTableSkeleton,
  AdminTableEmpty,
} from "@/components/admin/admin-table";
import { formatAdminDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminMediaItem, AdminMediaListResult } from "@/lib/data/admin-media";
import type { StorageUsage } from "@/lib/data/admin-stats";

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

async function fetchMedia(params: {
  page: number;
  scope: string;
  type: string;
  search: string;
}): Promise<AdminMediaListResult> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page));
  if (params.scope !== "all") qs.set("scope", params.scope);
  if (params.type !== "all") qs.set("type", params.type);
  if (params.search) qs.set("search", params.search);
  const res = await fetch(`/api/admin/media?${qs}`);
  if (!res.ok) throw new Error("Failed to load media");
  return res.json();
}

const scopeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  user: FolderOpen,
  character: Image,
  platform: HardDrive,
};

const scopeStyles: Record<string, string> = {
  user: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  character: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  platform: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

export function AdminStorageClient({ initialUsage }: { initialUsage: StorageUsage }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [scope, setScope] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [platformName, setPlatformName] = useState("offer-banner");
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminMediaItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "media", page, scope, type, search],
    queryFn: () => fetchMedia({ page, scope, type, search }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      toast.success("File deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handlePlatformUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!platformName.trim()) {
      toast.error("Enter a platform name first");
      return;
    }
    setUploading(true);
    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: file.type,
          size: file.size,
          scope: "platform",
          platformName: platformName.trim(),
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Upload failed");
      }
      const { uploadUrl, publicUrl } = (await res.json()) as {
        uploadUrl: string;
        publicUrl: string;
      };
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("R2 PUT failed");
      toast.success(`Uploaded platform/${platformName}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
      void navigator.clipboard.writeText(publicUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 25)));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Storage"
        description="R2 files — user uploads, character images, and platform assets."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{formatBytes(initialUsage.totalBytes)}</p>
              <p className="text-xs text-muted-foreground">{initialUsage.fileCount} files total</p>
            </div>
          </CardContent>
        </Card>
        {(["user", "character", "platform"] as const).map((s) => {
          const ScopeIcon = scopeIcons[s] ?? FolderOpen;
          return (
            <Card key={s}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn("rounded-lg p-2", scopeStyles[s]?.split(" ").slice(0, 2).join(" "))}>
                  <ScopeIcon className={cn("h-4 w-4", scopeStyles[s]?.split(" ")[1])} />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{formatBytes(initialUsage.byScope[s] ?? 0)}</p>
                  <p className="text-xs capitalize text-muted-foreground">{s}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload platform asset</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="platformName" className="text-sm text-muted-foreground">
              Asset name (e.g. offer-banner)
            </Label>
            <Input
              id="platformName"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              placeholder="offer-banner"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="platform-file">Platform asset file</Label>
            <Input
              id="platform-file"
              type="file"
              accept="image/*,video/*"
              className="max-w-xs"
              disabled={uploading}
              aria-label="Upload platform asset file"
              onChange={handlePlatformUpload}
            />
            {uploading && (
              <p className="mt-1 text-xs text-muted-foreground">Uploading…</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <Label htmlFor="media-search">Search files</Label>
          <Input
            id="media-search"
            placeholder="Search email or path…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="media-scope">Scope</Label>
          <Select
            value={scope}
            onValueChange={(v) => {
              setScope(v);
              setPage(1);
            }}
          >
            <SelectTrigger id="media-scope" className="w-[140px]">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All scopes</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="character">Character</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="media-type">Type</Label>
          <Select
            value={type}
            onValueChange={(v) => {
              setType(v);
              setPage(1);
            }}
          >
            <SelectTrigger id="media-type" className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <AdminTableScroll minWidth="800px">
            <AdminTableHead columns={["Preview", "Scope", "Owner", "Character", "Size", "Date", "Actions"]} />
            <tbody>
              {isLoading ? (
                <AdminTableSkeleton columns={7} />
              ) : items.length ? (
                items.map((item: AdminMediaItem) => (
                  <MediaRow
                    key={item.id}
                    item={item}
                    onDeleteRequest={() => setDeleteTarget(item)}
                    deleting={remove.isPending}
                  />
                ))
              ) : (
                <AdminTableEmpty
                  colSpan={7}
                  message="No files yet. Upload a platform asset or create a character with an image."
                />
              )}
            </tbody>
          </AdminTableScroll>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            aria-label="Previous page"
            onClick={() => setPage((p) => p - 1)}
            className="gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            aria-label="Next page"
            onClick={() => setPage((p) => p + 1)}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Delete this file from R2 and the database? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                if (deleteTarget) {
                  remove.mutate(deleteTarget.id, {
                    onSuccess: () => setDeleteTarget(null),
                  });
                }
              }}
            >
              {remove.isPending ? "Deleting…" : "Delete File"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MediaRow({
  item,
  onDeleteRequest,
  deleting,
}: {
  item: AdminMediaItem;
  onDeleteRequest: () => void;
  deleting: boolean;
}) {
  function copyUrl() {
    void navigator.clipboard.writeText(item.url);
    toast.success("URL copied");
  }

  return (
    <tr className="border-b last:border-0 transition-colors hover:bg-muted/30">
      <td className="px-4 py-3">
        {item.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            <Video className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge
          variant="outline"
          className={cn("capitalize text-xs", scopeStyles[item.scope] ?? scopeStyles.user)}
        >
          {item.scope}
        </Badge>
      </td>
      <td className="px-4 py-3 min-w-0">
        <span className="truncate block text-sm">{item.ownerEmail ?? item.profileId.slice(0, 8)}</span>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{item.characterName ?? "—"}</td>
      <td className="px-4 py-3 tabular-nums text-sm font-medium">{formatBytes(item.sizeBytes)}</td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
        {formatAdminDateTime(item.createdAt)}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyUrl} aria-label="Copy URL">
            <Copy className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label="Open file in new tab">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={deleting}
            onClick={onDeleteRequest}
            aria-label="Delete file"
          >
            <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
