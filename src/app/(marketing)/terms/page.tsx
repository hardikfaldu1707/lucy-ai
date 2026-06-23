import type { Metadata } from "next";
import { Section } from "@/components/shared/section";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <Section>
      <article className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: June 4, 2026</p>
        <h2>1. Acceptance</h2>
        <p>By accessing Lucy AI, you agree to these terms and our Privacy Policy.</p>
        <h2>2. Service description</h2>
        <p>Lucy AI provides AI companion services including chat, voice, and memory features for personal use.</p>
        <h2>3. User conduct</h2>
        <p>You agree not to misuse the service, attempt unauthorized access, or generate harmful content.</p>
        <h2>4. Subscriptions</h2>
        <p>Paid plans renew automatically unless cancelled. Refunds are handled per our billing policy.</p>
        <h2>5. Contact</h2>
        <p>Questions? Reach us at legal@lucy.ai</p>
      </article>
    </Section>
  );
}
