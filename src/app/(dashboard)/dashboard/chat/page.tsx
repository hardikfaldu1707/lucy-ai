import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatInboxPlaceholder } from "@/components/chat/chat-inbox-placeholder";
import { ROUTES } from "@/constants/routes";

export default function ChatIndexPage() {
  return (
    <div className="flex flex-1 flex-col">
      <ChatInboxPlaceholder variant="light" />
      <div className="border-t p-4 text-center sm:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href={ROUTES.publicChatNew}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Browse characters
          </Link>
        </Button>
      </div>
    </div>
  );
}
