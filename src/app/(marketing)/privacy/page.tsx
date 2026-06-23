import type { Metadata } from "next";
import { Section } from "@/components/shared/section";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <Section>
      <article className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: June 4, 2026</p>
        <h2>Data we collect</h2>
        <p>Account information, conversation data for memory features, and usage analytics to improve the service.</p>
        <h2>How we use data</h2>
        <p>To provide AI responses, personalize your experience, process payments, and maintain security.</p>
        <h2>Your rights</h2>
        <p>You may export, correct, or delete your data from Settings. EU users have GDPR rights.</p>
        <h2>Security</h2>
        <p>We implement industry-standard encryption and access controls across our infrastructure.</p>
      </article>
    </Section>
  );
}
