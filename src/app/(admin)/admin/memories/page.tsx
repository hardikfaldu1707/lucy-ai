import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listMemories } from "@/lib/data/admin-memories";

export const metadata: Metadata = { title: "Memories" };

export default async function AdminMemoriesPage() {
  const { items, total } = await listMemories(1);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Memories"
        description={`Platform-wide memory overview — ${total.toLocaleString()} total.`}
      />
      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{m.title}</p>
                  <Badge variant="outline" className="capitalize">{m.type}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{m.content}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {m.email ?? "unknown"} · {new Date(m.createdAt).toLocaleDateString()}
                  {m.isPinned && " · pinned"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No memories yet.</p>
      )}
    </div>
  );
}
