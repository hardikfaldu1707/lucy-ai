import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { AppProviders } from "@/providers/app-providers";
import { ChunkLoadRecovery } from "@/components/dev/chunk-load-recovery";
import { OrganizationJsonLd } from "@/components/shared/organization-json-ld";
import { getClerkAllowedRedirectOrigins } from "@/lib/clerk-allowed-origins";
import { resolveTenant } from "@/lib/tenant";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://lucyai.com"),
  title: {
    default: "Lucy AI — Your AI Companion",
    template: "%s | Lucy AI",
  },
  description:
    "Lucy AI is a premium AI companion platform with memory, voice, and emotionally intelligent conversations.",
  keywords: ["AI companion", "AI girlfriend", "Lucy AI", "virtual companion"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Lucy AI",
    title: "Lucy AI — Your AI Companion",
    description:
      "Premium AI companions with memory, voice calls, and emotionally intelligent chat.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lucy AI — Your AI Companion",
    description:
      "Premium AI companions with memory, voice calls, and emotionally intelligent chat.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lucy AI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1a1625" },
    { media: "(prefers-color-scheme: light)", color: "#faf9fc" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await resolveTenant();
  const allowedRedirectOrigins = getClerkAllowedRedirectOrigins();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={{ "--tenant-primary": tenant.primaryColor } as Record<string, string>}
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        data-tenant={tenant.slug}
        suppressHydrationWarning
      >
        <OrganizationJsonLd />
        <ClerkProvider
          appearance={{ theme: shadcn }}
          {...(allowedRedirectOrigins ? { allowedRedirectOrigins } : {})}
        >
          <ChunkLoadRecovery />
          <AppProviders>{children}</AppProviders>
        </ClerkProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
