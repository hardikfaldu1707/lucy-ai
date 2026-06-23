import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreateAiGirlfriendPage } from "@/components/create/create-ai-girlfriend-page";
import { signInHrefForCreate } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Create Your AI Girl",
  description:
    "Design your AI girlfriend — choose style, personality, and relationship, then start chatting.",
};

export default async function CreatePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect(signInHrefForCreate());
  }

  return (
    <Suspense fallback={null}>
      <CreateAiGirlfriendPage />
    </Suspense>
  );
}
