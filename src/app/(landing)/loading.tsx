import { Skeleton } from "@/components/ui/skeleton";

export default function LandingLoading() {
  return (
    <div className="min-h-screen bg-black md:py-6 md:pb-10">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-6 sm:px-5 md:px-6 lg:px-8">
        <Skeleton className="h-[200px] w-full rounded-2xl bg-white/10 sm:h-[240px]" />
        <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl bg-white/10" />
          ))}
        </div>
      </div>
    </div>
  );
}
