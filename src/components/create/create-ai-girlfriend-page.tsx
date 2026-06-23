"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const CreateCharacterWizard = dynamic(
  () => import("./create-character-wizard").then((m) => m.CreateCharacterWizard),
  {
    loading: () => (
      <div className="mx-auto max-w-3xl space-y-6 p-4">
        <Skeleton className="h-10 w-48 bg-white/10" />
        <Skeleton className="h-64 w-full rounded-2xl bg-white/10" />
        <Skeleton className="h-12 w-full rounded-xl bg-white/10" />
      </div>
    ),
  },
);

export function CreateAiGirlfriendPage() {
  return <CreateCharacterWizard />;
}
