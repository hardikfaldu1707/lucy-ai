import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { ChatNewRedirect } from "@/components/chat/chat-new-redirect";
import { PublicChatBrowse } from "@/components/chat/public-chat-browse";
import { listChatBrowseCharacters } from "@/lib/data/characters-public";
import { ensureProfile } from "@/lib/ensure-profile";

export const metadata: Metadata = {
  title: "New Chat",
  description: "Choose an AI companion to start a new conversation.",
};

export default async function PublicChatNewPage() {
  const { userId } = await auth();
  if (userId) {
    await ensureProfile({ skipAllowance: true });
  }
  const initialCharacters = await listChatBrowseCharacters(userId ?? undefined);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <Suspense fallback={null}>
        <ChatNewRedirect />
      </Suspense>
      <PublicChatBrowse initialCharacters={initialCharacters} />
    </div>
  );
}
