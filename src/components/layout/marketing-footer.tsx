import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { ROUTES } from "@/constants/routes";

export function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground">
              Your AI companion that remembers, cares, and grows with you.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={ROUTES.features} className="hover:text-foreground">Features</Link></li>
              <li><Link href={ROUTES.pricing} className="hover:text-foreground">Pricing</Link></li>
              <li><Link href={ROUTES.faq} className="hover:text-foreground">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={ROUTES.terms} className="hover:text-foreground">Terms</Link></li>
              <li><Link href={ROUTES.privacy} className="hover:text-foreground">Privacy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={ROUTES.contact} className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t pt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Lucy AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
