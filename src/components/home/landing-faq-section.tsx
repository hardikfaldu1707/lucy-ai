"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LANDING_FAQ_ITEMS } from "@/constants/landing-faq";

export function LandingFaqSection() {
  return (
    <section
      className="w-full max-w-3xl mx-auto text-center"
      aria-labelledby="landing-faq-heading"
    >
      <h2
        id="landing-faq-heading"
        className="text-3xl font-bold uppercase tracking-tight text-white sm:text-4xl md:text-5xl"
      >
        FAQ
      </h2>
      <p className="mt-3 text-sm text-white/50 sm:text-base">
        Got questions? We have your answers!
      </p>

      <Accordion
        type="single"
        collapsible
        className="mt-10 space-y-3 text-left"
      >
        {LANDING_FAQ_ITEMS.map((item, index) => (
          <AccordionItem
            key={item.question}
            value={`faq-${index}`}
            className="mb-3 overflow-hidden rounded-xl border-0 border-b-0 bg-[#1a1a1a] px-0 last:mb-0"
          >
            <AccordionTrigger className="px-5 py-4 text-left font-bold text-white hover:no-underline hover:bg-white/5 [&[data-state=open]>svg]:rotate-180 sm:px-6 sm:py-5 sm:text-base">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 text-sm leading-relaxed text-white/65 sm:px-6">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
