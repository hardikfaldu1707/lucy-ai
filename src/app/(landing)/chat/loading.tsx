import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-[#0a0a0a]">
      <aside className="hidden w-80 shrink-0 flex-col border-r border-white/10 md:flex">
        <Skeleton className="h-14 w-full shrink-0 bg-white/10" />
        <div className="flex-1 space-y-2 p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[60px] w-full rounded-xl bg-white/10" />
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Skeleton className="h-14 w-full shrink-0 bg-white/10" />
        <div className="flex-1 space-y-4 p-4">
          <Skeleton className="h-12 w-2/3 rounded-2xl bg-white/10" />
          <Skeleton className="ml-auto h-12 w-1/2 rounded-2xl bg-pink-500/20" />
          <Skeleton className="h-12 w-2/3 rounded-2xl bg-white/10" />
        </div>
        <Skeleton className="h-16 shrink-0 bg-white/10" />
      </div>
    </div>
  );
}
