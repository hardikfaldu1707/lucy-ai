"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ROUTES } from "@/constants/routes";

const SERVICE_COL_2 = [
  { label: "FAQ", href: ROUTES.faq },
  { label: "Contact", href: ROUTES.contact },
  { label: "Terms and Policies", href: ROUTES.terms },
  { label: "Privacy Policy", href: ROUTES.privacy },
  { label: "Become an Affiliate", href: ROUTES.contact },
];

export function LandingFooterServices() {
  const { isSignedIn } = useAuth();

  const serviceCol1 = [
    { label: "AI Girlfriend Chat", href: ROUTES.publicChat },
    { label: "Browse companions", href: ROUTES.home },
    {
      label: "Voice Calls",
      href: isSignedIn ? ROUTES.voice : ROUTES.publicVoice,
    },
    { label: "Pricing", href: ROUTES.pricing },
    { label: "Features", href: ROUTES.features },
  ];

  return (
    <div>
      <h3 className="text-lg font-bold text-white">Services</h3>
      <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
        <ul className="space-y-2">
          {serviceCol1.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="text-sm text-white/55 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="space-y-2">
          {SERVICE_COL_2.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="text-sm text-white/55 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
