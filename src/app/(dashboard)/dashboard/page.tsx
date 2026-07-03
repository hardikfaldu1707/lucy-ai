import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CreditCard, MessageCircle } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/shared/page-header";
import { CoinBalanceBadge } from "@/components/shared/coin-balance-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { formatRelativeTime } from "@/lib/utils";
import { ensureProfile } from "@/lib/ensure-profile";
import { getProfile } from "@/lib/data/profiles";
import { getDashboardSnapshot } from "@/lib/data/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardHomePage() {
  const { userId } = await auth();
  let profile: Awaited<ReturnType<typeof getProfile>> = null;
  let snapshot = {
    activeCharacter: null as Awaited<ReturnType<typeof getDashboardSnapshot>>["activeCharacter"],
    recentConversations: [] as Awaited<ReturnType<typeof getDashboardSnapshot>>["recentConversations"],
  };

  try {
    if (userId) {
      await ensureProfile();
      [profile, snapshot] = await Promise.all([
        getProfile(),
        getDashboardSnapshot(userId),
      ]);
    }
  } catch {
    // Supabase not configured yet
  }

  const displayName = profile?.username ?? null;
  const welcome = displayName ? `Welcome back, ${displayName}` : "Welcome back";
  const { activeCharacter, recentConversations } = snapshot;

  return (
    <div className="space-y-8">
      <PageHeader title={welcome} description="Here's what's happening with your companions today." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background lg:col-span-2 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
          <CardHeader>
            <CardTitle>Active character</CardTitle>
            <CardDescription>Your primary companion right now</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {activeCharacter ? (
              <>
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                  <Image
                    src={activeCharacter.avatarUrl}
                    alt={activeCharacter.name}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-semibold tracking-tight">{activeCharacter.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {activeCharacter.tagline}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className="capitalize">{activeCharacter.relationshipStatus}</Badge>
                    <Badge variant="secondary">{activeCharacter.messageCount} messages</Badge>
                  </div>
                </div>
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-md shadow-pink-500/25 hover:from-pink-400 hover:to-fuchsia-500 sm:w-auto"
                >
                  <Link
                    href={ROUTES.publicChatWithCharacter(activeCharacter.id)}
                    prefetch
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Continue chat
                  </Link>
                </Button>
              </>
            ) : (
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Start your first conversation to see your active companion here.
                </p>
                <Button asChild>
                  <Link href={ROUTES.publicChatNew}>Browse companions</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-gradient-to-b from-muted/30 to-background transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize text-primary">{profile?.plan ?? "free"}</p>
            <div className="mt-3 rounded-xl border bg-background/80 px-3 py-2">
              <CoinBalanceBadge variant="card" />
            </div>
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href={ROUTES.subscription}>Manage plan</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent chats</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={ROUTES.publicChat}>
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentConversations.length ? (
              recentConversations.map((c) => (
                <Link
                  key={c.id}
                  href={ROUTES.publicChatWithCharacter(c.characterId)}
                  prefetch
                  className="group flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200 hover:bg-muted/80 hover:translate-x-1"
                >
                  <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border transition-transform duration-300 group-hover:scale-105">
                    <AvatarImage src={c.characterAvatar} alt={c.characterName} />
                    <AvatarFallback>{c.characterName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.characterName}</p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{c.lastMessage}</p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatRelativeTime(c.lastMessageAt)}
                  </span>
                </Link>
              ))
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">No conversations yet.</p>
                <Button variant="link" className="mt-2" asChild>
                  <Link href={ROUTES.publicChatNew}>Start a chat</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
