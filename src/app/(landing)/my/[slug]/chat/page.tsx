import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

type PageProps = { params: Promise<{ slug: string }> };

export default async function MyGirlChatPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(ROUTES.publicChatWithCharacter(decodeURIComponent(slug)));
}
