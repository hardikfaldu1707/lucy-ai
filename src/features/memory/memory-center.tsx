"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pin, Pencil, Trash2, Search, Brain } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MemoryItem, MemoryType } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

const MEMORY_TABS: { value: MemoryType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "personality", label: "Personality" },
  { value: "relationship", label: "Relationship" },
  { value: "semantic", label: "Semantic" },
  { value: "episodic", label: "Episodic" },
];

async function fetchMemories(): Promise<MemoryItem[]> {
  const res = await fetch("/api/memories");
  if (!res.ok) throw new Error("Failed to load");
  const data = (await res.json()) as { memories: MemoryItem[] };
  return data.memories;
}

export function MemoryCenter() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading: loading, isError, refetch } = useQuery({
    queryKey: ["memories"],
    queryFn: fetchMemories,
    refetchOnWindowFocus: true,
  });
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<MemoryType | "all">("all");
  const [editing, setEditing] = useState<MemoryItem | null>(null);

  const filtered = useMemo(() => {
    return items.filter((m) => {
      const matchTab = tab === "all" || m.type === tab;
      const matchSearch =
        !search ||
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.content.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [items, search, tab]);

  const togglePin = async (id: string) => {
    const item = items.find((m) => m.id === id);
    if (!item) return;
    const res = await fetch(`/api/memories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !item.isPinned }),
    });
    if (!res.ok) {
      toast.error("Failed to update memory");
      return;
    }
    const { memory } = (await res.json()) as { memory: MemoryItem };
    queryClient.setQueryData<MemoryItem[]>(["memories"], (prev = []) =>
      prev.map((m) => (m.id === id ? memory : m)),
    );
    toast.success("Memory updated");
  };

  const deleteMemory = async (id: string) => {
    const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete memory");
      return;
    }
    queryClient.setQueryData<MemoryItem[]>(["memories"], (prev = []) =>
      prev.filter((m) => m.id !== id),
    );
    toast.success("Memory deleted");
  };

  const saveEdit = async () => {
    if (!editing) return;
    const res = await fetch(`/api/memories/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editing.title,
        content: editing.content,
        type: editing.type,
      }),
    });
    if (!res.ok) {
      toast.error("Failed to save memory");
      return;
    }
    const { memory } = (await res.json()) as { memory: MemoryItem };
    queryClient.setQueryData<MemoryItem[]>(["memories"], (prev = []) =>
      prev.map((m) => (m.id === editing.id ? memory : m)),
    );
    setEditing(null);
    toast.success("Memory saved");
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Memory center"
        description="View and manage what Lucy remembers about you."
      />
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search memories..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as MemoryType | "all")}>
        <TabsList className="w-full justify-start overflow-x-auto scrollbar-thin">
          {MEMORY_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="mt-6 space-y-4">
          {isError ? (
            <ErrorState
              title="Could not load memories"
              message="Check your connection and try again."
              onRetry={() => void refetch()}
            />
          ) : loading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading memories">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Brain}
              title="No memories yet"
              description="Chat with a character and Lucy will learn about you over time."
            />
          ) : (
            filtered.map((m) => (
              <Card key={m.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                  <div>
                    <CardTitle className="text-base">{m.title}</CardTitle>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {m.type}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => togglePin(m.id)}>
                      <Pin className={m.isPinned ? "fill-primary text-primary" : ""} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditing(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMemory(m.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{m.content}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatRelativeTime(m.updatedAt)}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit memory</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="mem-title">Title</Label>
                <Input
                  id="mem-title"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="mem-content">Content</Label>
                <Textarea
                  id="mem-content"
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
