import { Skeleton } from "@/components/ui/skeleton";

export default function ChatConversationLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3">
        <Skeleton className="h-12 w-12 rounded-full bg-white/10" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 bg-white/10" />
          <Skeleton className="h-3 w-16 bg-white/10" />
        </div>
      </div>
      <div className="flex-1 space-y-4 p-4">
        <Skeleton className="h-12 w-2/3 rounded-2xl bg-white/10" />
        <Skeleton className="ml-auto h-12 w-1/2 rounded-2xl bg-pink-500/20" />
        <Skeleton className="h-12 w-3/4 rounded-2xl bg-white/10" />
      </div>
      <Skeleton className="h-16 shrink-0 bg-white/10" />
    </div>
  );
}
