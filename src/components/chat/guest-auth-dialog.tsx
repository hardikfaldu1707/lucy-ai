"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { loginForGuestChat, signupForGuestChat } from "@/constants/routes";

interface GuestAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterSlug: string;
  characterName?: string;
}

export function GuestAuthDialog({
  open,
  onOpenChange,
  characterSlug,
  characterName,
}: GuestAuthDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create your free account to continue chatting</DialogTitle>
          <DialogDescription>
            {characterName
              ? `Sign up to keep talking with ${characterName} and unlock unlimited messages.`
              : "Sign up to continue your conversation and unlock the full Lucy experience."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <Button className="w-full" size="lg" asChild>
            <Link href={signupForGuestChat(characterSlug)}>Create free account</Link>
          </Button>
          <Button variant="outline" className="w-full" size="lg" asChild>
            <Link href={loginForGuestChat(characterSlug)}>I already have an account</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
