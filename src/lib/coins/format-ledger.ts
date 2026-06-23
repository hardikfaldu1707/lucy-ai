type LedgerMetadata = Record<string, unknown>;

function metaString(meta: LedgerMetadata, key: string): string | undefined {
  const v = meta[key];
  return typeof v === "string" && v.trim() ? v : undefined;
}

export function formatCoinLedgerLabel(reason: string, metadata: LedgerMetadata): string {
  const description = metaString(metadata, "description");
  if (description) return description;

  const characterName = metaString(metadata, "characterName");

  switch (reason) {
    case "spend_photo":
      return characterName
        ? `Unlocked profile photo — ${characterName}`
        : "Unlocked profile photo";
    case "spend_text":
      return "Chat message";
    case "spend_image":
      return "Image generation";
    case "spend_voice":
      return metaString(metadata, "action") === "voice_session"
        ? "Voice call session"
        : "Voice message";
    case "subscription_grant":
      return "Monthly coin allowance";
    case "purchase":
      return "Coin pack purchase";
    case "signup_bonus":
      return "Signup bonus";
    case "admin_grant":
      return "Admin coin grant";
    case "refund":
      return "Coin refund";
    case "adjustment":
      return "Balance adjustment";
    default:
      return reason.replace(/_/g, " ");
  }
}
