"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: ROUTES.features, label: "Features" },
  { href: ROUTES.pricing, label: "Pricing" },
  { href: ROUTES.faq, label: "FAQ" },
  { href: ROUTES.contact, label: "Contact" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Show when="signed-out">
            <SignInButton forceRedirectUrl={ROUTES.home} fallbackRedirectUrl={ROUTES.home}>
              <Button variant="ghost">Log in</Button>
            </SignInButton>
            <SignUpButton forceRedirectUrl={ROUTES.home} fallbackRedirectUrl={ROUTES.home}>
              <Button className="glow-primary">Get started</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Button variant="ghost" asChild>
              <Link href={ROUTES.home}>Home</Link>
            </Button>
            <UserButton />
          </Show>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <m.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn("overflow-hidden border-t md:hidden")}
            aria-label="Mobile"
          >
            <div className="flex flex-col gap-2 px-4 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-3 py-2 text-sm hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Show when="signed-out">
                <SignInButton forceRedirectUrl={ROUTES.home} fallbackRedirectUrl={ROUTES.home}>
                  <Button variant="ghost" className="mt-2" onClick={() => setOpen(false)}>
                    Log in
                  </Button>
                </SignInButton>
                <SignUpButton forceRedirectUrl={ROUTES.home} fallbackRedirectUrl={ROUTES.home}>
                  <Button className="mt-1" onClick={() => setOpen(false)}>
                    Get started
                  </Button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Button asChild className="mt-2" onClick={() => setOpen(false)}>
                  <Link href={ROUTES.home}>Go to home</Link>
                </Button>
              </Show>
            </div>
          </m.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
