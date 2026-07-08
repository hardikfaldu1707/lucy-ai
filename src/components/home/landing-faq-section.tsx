"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LANDING_FAQ_ITEMS } from "@/constants/landing-faq";
import { m } from "framer-motion";

export function LandingFaqSection() {
  return (
    <section
      className="w-full max-w-3xl mx-auto text-center relative z-10"
      aria-labelledby="landing-faq-heading"
    >
      <h2
        id="landing-faq-heading"
        className="font-display text-3xl font-normal tracking-tight text-white sm:text-4xl md:text-5xl"
      >
        FAQ
      </h2>
      <p className="mt-3 text-sm text-white/50 sm:text-base">
        Got questions? We have your answers!
      </p>

      <Accordion
        type="single"
        collapsible
        className="mt-10 space-y-3.5 text-left"
      >
        {LANDING_FAQ_ITEMS.map((item, index) => (
          <m.div
            key={item.question}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <AccordionItem
              value={`faq-${index}`}
              className="group mb-0 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl px-0 transition-all duration-300 data-[state=open]:border-pink-500/30 data-[state=open]:shadow-[0_0_20px_rgba(236,72,153,0.1)] hover:border-white/10"
            >
              <AccordionTrigger className="flex w-full items-center justify-between px-5 py-4 text-left font-bold text-white hover:no-underline hover:bg-white/5 [&[data-state=open]>svg]:rotate-180 sm:px-6 sm:py-5 sm:text-base transition-colors duration-200">
                <span className="pr-4">{item.question}</span>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 text-sm leading-relaxed text-white/70 sm:px-6">
                <div className="pt-2 border-t border-white/5">
                  {item.answer}
                </div>
              </AccordionContent>
            </AccordionItem>
          </m.div>
        ))}
      </Accordion>
    </section>
  );
}
