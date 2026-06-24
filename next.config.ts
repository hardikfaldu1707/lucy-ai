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

const r2Host = r2PublicHost();
const r2ImgSrc = r2Host ? ` https://${r2Host}` : " https://*.r2.dev";

function r2PresignConnectSrc(): string {
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET;
  if (accountId && bucket) {
    return ` https://${bucket}.${accountId}.r2.cloudflarestorage.com https://${accountId}.r2.cloudflarestorage.com`;
  }
  return "";
}

const securityHeaders = [
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
      `script-src 'self' 'unsafe-inline'${
        process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""
      } https://clerk.lucyai.com https://*.clerk.accounts.dev`,
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: https://img.clerk.com https://api.dicebear.com https://*.supabase.co https://images.unsplash.com https://picsum.photos${r2ImgSrc}`,
      `media-src 'self' blob:${r2ImgSrc}`,
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://*.clerk.accounts.dev wss://*.supabase.co https://vitals.vercel-insights.com https://*.r2.cloudflarestorage.com" +
        r2PresignConnectSrc() +
        r2ImgSrc,
      "frame-src https://clerk.lucyai.com https://*.clerk.accounts.dev",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

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

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: imageRemotePatterns,
  },
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
