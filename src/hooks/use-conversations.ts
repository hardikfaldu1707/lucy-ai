"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import type { Conversation } from "@/types";

export const CONVERSATIONS_QUERY_KEY = ["chat", "conversations"] as const;

async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch("/api/chat/conversations");
  if (!res.ok) throw new Error("Failed to load conversations");
  const json = (await res.json()) as { conversations: Conversation[] };
  return json.conversations ?? [];
}

export function useConversations(initialData?: Conversation[]) {
  const { isSignedIn, isLoaded } = useAuth();

  return useQuery<Conversation[]>({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: fetchConversations,
    initialData,
    staleTime: 30_000,
    enabled: isLoaded && isSignedIn,
  });
}
