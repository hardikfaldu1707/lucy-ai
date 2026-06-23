const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://lucyai.com").replace(/\/$/, "");

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Lucy AI",
  url: BASE_URL,
  description:
    "Premium AI companion platform with memory, voice calls, and emotionally intelligent conversations.",
};

export function OrganizationJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
    />
  );
}
