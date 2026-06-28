"use client";

import { usePathname } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-dialog-a11y";

export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
