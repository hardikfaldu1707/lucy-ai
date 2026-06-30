import type { Metadata } from "next";
import { Section } from "@/components/shared/section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "FAQ",
};

const FAQ_ITEMS = [
  {
    q: "What is Lucy AI?",
    a: "Lucy AI is a premium AI companion platform designed for meaningful, emotionally intelligent conversations with persistent memory.",
  },
  {
    q: "Is my data private?",
    a: "Yes. We use encryption in transit and at rest, offer granular privacy controls, and never sell your personal conversations.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Cancel from your subscription settings. You retain access until the end of your billing period.",
  },
  {
    q: "How does memory work?",
    a: "Lucy organizes memories into personality, relationship, semantic, and episodic layers — all editable from the Memory Center.",
  },
  {
    q: "Do you offer voice calls?",
    a: "Voice calls are available on Premium and Ultimate plans with natural, low-latency speech synthesis.",
  },
];

export default function FAQPage() {
  return (
    <Section>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-center text-4xl font-normal">Frequently asked questions</h1>
        <Accordion type="single" collapsible className="mt-12">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
