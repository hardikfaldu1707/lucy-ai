import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ChatConversationListView } from "@/components/chat/chat-conversation-list-view";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Chats",
  description: "Your AI companion conversations.",
};

export default async function PublicChatPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect(ROUTES.publicChatNew);
  }

  return <ChatConversationListView />;
}
