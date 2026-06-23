import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { getConversationById } from "@/lib/data/chat";
import { ensureProfile } from "@/lib/ensure-profile";
import { ROUTES } from "@/constants/routes";

type PageProps = { params: Promise<{ id: string }> };

export default async function ChatConversationPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) notFound();

  await ensureProfile();

  const { id } = await params;
  const conversation = await getConversationById(id, userId);
  if (!conversation) notFound();

  redirect(
    ROUTES.publicChatWithCharacter(conversation.character.slug ?? conversation.characterId),
  );
}
