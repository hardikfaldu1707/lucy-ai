import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

type PageProps = { params: Promise<{ id: string }> };

export default async function CharacterDetailPage({ params }: PageProps) {
  const { id } = await params;
  redirect(ROUTES.publicChatWithCharacter(decodeURIComponent(id)));
}
