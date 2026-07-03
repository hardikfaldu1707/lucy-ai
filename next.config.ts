import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

function r2PublicHost(): string | null {
  const raw = process.env.R2_PUBLIC_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

function r2PresignConnectSrc(): string {
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET;
  if (accountId && bucket) {
    return ` https://${bucket}.${accountId}.r2.cloudflarestorage.com https://${accountId}.r2.cloudflarestorage.com`;
  }
  return "";
}

const r2Host = r2PublicHost();
const r2ImgSrc = r2Host ? ` https://${r2Host}` : " https://*.r2.dev";

function buildSecurityHeaders() {
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrcDirective =
    "script-src 'self' 'unsafe-inline'" +
    (isDev ? " 'unsafe-eval'" : "") +
    " https://clerk.lucyailove.com https://*.clerk.accounts.dev";

  return [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(self), geolocation=()",
    },
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        scriptSrcDirective,
        "style-src 'self' 'unsafe-inline'",
        `img-src 'self' data: blob: https://img.clerk.com https://api.dicebear.com https://*.supabase.co https://images.unsplash.com https://picsum.photos${r2ImgSrc}`,
        `media-src 'self' blob:${r2ImgSrc}`,
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://*.supabase.co https://*.clerk.accounts.dev wss://*.supabase.co https://vitals.vercel-insights.com https://*.r2.cloudflarestorage.com" +
          r2PresignConnectSrc() +
          r2ImgSrc,
        "frame-src https://clerk.lucyailove.com https://*.clerk.accounts.dev",
        "frame-ancestors 'none'",
      ].join("; "),
    },
  ];
}

const imageRemotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  { protocol: "https", hostname: "img.clerk.com" },
  { protocol: "https", hostname: "api.dicebear.com" },
  {
    protocol: "https",
    hostname: "*.supabase.co",
    pathname: "/storage/v1/object/public/**",
  },
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "picsum.photos" },
];

if (r2Host) {
  imageRemotePatterns.push({
    protocol: "https",
    hostname: r2Host,
    pathname: "/**",
  });
} else {
  imageRemotePatterns.push({
    protocol: "https",
    hostname: "*.r2.dev",
    pathname: "/**",
  });
}

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "react-icons"],
    // Clerk proxy buffers request bodies; default 10MB truncates admin video uploads.
    proxyClientMaxBodySize: "55mb",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: buildSecurityHeaders(),
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: imageRemotePatterns,
    // Avoid Next image optimizer upstream timeouts to R2 during local dev.
    unoptimized: isDev,
  },
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
