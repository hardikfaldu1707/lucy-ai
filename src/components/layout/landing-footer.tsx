import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { SiDiscord, SiMastercard, SiVisa, SiX } from "react-icons/si";
import { LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { LandingFooterServices } from "@/components/layout/landing-footer-services";
import { ROUTES } from "@/constants/routes";

const SOCIAL_LINKS = {
  x: "https://x.com/lucyailove",
  discord: "https://discord.gg/lucyai",
} as const;

export function LandingFooter() {
  return (
    <footer className="w-full max-w-[1400px] border-t border-white/10 px-4 pt-12 sm:px-6 sm:pt-16">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="space-y-6">
          <Link href={ROUTES.home} className="inline-flex items-center gap-2">
            <LogoMark size={40} />
            <span className="text-2xl font-bold lowercase text-white">lucy</span>
          </Link>

          <div>
            <h2 className="font-display text-xl font-normal text-white sm:text-2xl">
              Chat with AI Girlfriend Online for Free
            </h2>
            <p className="mt-2 text-sm text-white/50">Sign up, swipe and enjoy</p>
          </div>

          <div className="flex max-w-md flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-12 flex-1 rounded-2xl bg-white text-base font-semibold text-black hover:bg-white/90"
            >
              <Link href={ROUTES.signup}>Try For Free</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 flex-1 rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              <Link href={ROUTES.contact} className="inline-flex items-center gap-2">
                <MessageCircle className="h-4 w-4" aria-hidden />
                Become an Affiliate
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="mailto:support@lucy.ai"
              aria-label="Email support"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a1a1a] text-white/80 transition-colors hover:bg-[#252525] hover:text-white"
            >
              <Mail className="h-4 w-4" />
            </a>
            <a
              href={SOCIAL_LINKS.x}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow on X"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a1a1a] text-white/80 transition-colors hover:bg-[#252525] hover:text-white"
            >
              <SiX className="h-4 w-4" aria-hidden />
            </a>
            <a
              href={SOCIAL_LINKS.discord}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join Discord"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a1a1a] text-white/80 transition-colors hover:bg-[#252525] hover:text-white"
            >
              <SiDiscord className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>

        <LandingFooterServices />
      </div>

      <div className="mt-12 border-t border-white/10 pt-8 text-center">
        <div className="flex items-center justify-center gap-4">
          <span
            className="flex h-8 items-center rounded bg-white/10 px-3 text-white/80"
            aria-label="Visa accepted"
          >
            <SiVisa className="h-4 w-auto" aria-hidden />
          </span>
          <span
            className="flex h-8 items-center rounded bg-white/10 px-3 text-white/80"
            aria-label="Mastercard accepted"
          >
            <SiMastercard className="h-5 w-auto" aria-hidden />
          </span>
        </div>
        <p className="mt-4 text-sm text-white/50">
          © {new Date().getFullYear()} Lucy AI. All rights reserved.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-[10px] leading-relaxed text-white/35">
          Lucy AI Ltd. · Registered address available on request · Organization
          no. HE-000000 · AI companion services for adults 18+ where applicable.
        </p>
      </div>
    </footer>
  );
}
