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
        {/* Active Character Card */}
        <Card className="overflow-hidden border-white/5 bg-zinc-950/40 backdrop-blur-md lg:col-span-2 transition-all duration-300 hover:border-pink-500/20 hover:shadow-[0_0_30px_rgba(236,72,153,0.04)]">
          <CardHeader>
            <CardTitle className="text-white">Active companion</CardTitle>
            <CardDescription className="text-white/60">Your primary companion right now</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            {activeCharacter ? (
              <>
                <div className="flex items-center gap-4 sm:contents w-full">
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl ring-2 ring-pink-500/25 ring-offset-2 ring-offset-black">
                    <Image
                      src={activeCharacter.avatarUrl}
                      alt={activeCharacter.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 80px, 96px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">{activeCharacter.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-white/70">
                      {activeCharacter.tagline}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <Badge className="capitalize bg-pink-500/10 text-pink-400 hover:bg-pink-500/15 border-none text-[10px] sm:text-xs py-0.5 px-2 font-medium">
                        {activeCharacter.relationshipStatus}
                      </Badge>
                      <Badge variant="secondary" className="bg-white/5 text-white/80 hover:bg-white/10 border-none text-[10px] sm:text-xs py-0.5 px-2 font-medium">
                        {activeCharacter.messageCount} messages
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-md shadow-pink-500/25 hover:from-pink-400 hover:to-fuchsia-500 sm:w-auto mt-2 sm:mt-0 shrink-0 font-semibold"
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
              <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
                <p className="text-sm text-white/60">
                  Start your first conversation to see your active companion here.
                </p>
                <Button asChild className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-400 hover:to-fuchsia-500 text-white font-semibold">
                  <Link href={ROUTES.publicChatNew}>Browse companions</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription / Plan Card */}
        <Card className="border-white/5 bg-zinc-950/40 backdrop-blur-md transition-all duration-300 hover:border-pink-500/20 hover:shadow-[0_0_30px_rgba(236,72,153,0.04)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5 text-pink-500" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black capitalize bg-gradient-to-r from-pink-400 to-fuchsia-500 bg-clip-text text-transparent">
              {profile?.plan ?? "free"}
            </p>
            <div className="mt-3 rounded-xl border border-white/5 bg-black/40 px-3 py-2">
              <CoinBalanceBadge variant="card" />
            </div>
            <Button variant="outline" className="mt-4 w-full border-zinc-800 hover:bg-white/5 hover:text-white" asChild>
              <Link href={ROUTES.subscription}>Manage plan</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Chats Section */}
      <div className="grid gap-6 md:grid-cols-1">
        <Card className="border-white/5 bg-zinc-950/40 backdrop-blur-md transition-all duration-300 hover:border-pink-500/20 hover:shadow-[0_0_30px_rgba(236,72,153,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Recent chats</CardTitle>
            <Button variant="ghost" size="sm" className="text-pink-400 hover:text-pink-300 hover:bg-pink-500/5 font-semibold" asChild>
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
                  className="group flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200 hover:bg-white/[0.03] active:scale-[0.98]"
                >
                  <Avatar className="h-10 w-10 shrink-0 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105">
                    <AvatarImage src={c.characterAvatar} alt={c.characterName} />
                    <AvatarFallback className="bg-pink-500/10 text-pink-400">{c.characterName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white group-hover:text-pink-400 transition-colors">{c.characterName}</p>
                    <p className="line-clamp-1 text-sm text-white/60">{c.lastMessage}</p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-white/40">
                    {formatRelativeTime(c.lastMessageAt)}
                  </span>
                </Link>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-white/50">No conversations yet.</p>
                <Button variant="link" className="mt-2 text-pink-400 hover:text-pink-300" asChild>
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
