import "server-only";

export function isUpgateConfigured(): boolean {
  return Boolean(process.env.UPGATE_API_KEY);
}

export function getUpgateBaseUrl(): string {
  return process.env.UPGATE_BASE_URL || "https://api.sandbox.upgate.com/v1";
}

export interface UpgateTransactionInput {
  amount: number;
  currency: string;
  plan?: string;
  packId?: string;
  profileId: string;
  cardDetails?: {
    cardholderName: string;
    cardNumber: string;
    expiryDate: string; // MM/YY
    cvc: string;
  };
  email?: string;
}

export async function createUpgateCharge(input: UpgateTransactionInput) {
  const apiKey = process.env.UPGATE_API_KEY;
  if (!apiKey) throw new Error("UPGATE_API_KEY is not configured");

  const baseUrl = getUpgateBaseUrl();

  const [expMonthStr, expYearStr] = (input.cardDetails?.expiryDate ?? "12/28").split("/");
  const expMonth = expMonthStr.padStart(2, "0");
  const expYear = "20" + expYearStr;
  const cleanCardNumber = input.cardDetails?.cardNumber.replace(/\s/g, "") ?? "";

  // Structure request payload according to UpGate unified API specs
  const payload = {
    amount: input.amount,
    currency: input.currency.toUpperCase(),
    payment_method: {
      type: "card",
      card: {
        number: cleanCardNumber,
        expiration_month: expMonth,
        expiration_year: expYear,
        cvc: input.cardDetails?.cvc,
        cardholder_name: input.cardDetails?.cardholderName,
      },
    },
    customer: {
      email: input.email,
      metadata: {
        profile_id: input.profileId,
        plan: input.plan,
        pack_id: input.packId,
      },
    },
    metadata: {
      profile_id: input.profileId,
      plan: input.plan,
      pack_id: input.packId,
    },
  };

  const response = await fetch(`${baseUrl}/sale`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedError;
    try {
      parsedError = JSON.parse(errorText);
    } catch {
      // not JSON
    }
    throw new Error(
      parsedError?.message || 
      parsedError?.error || 
      errorText || 
      "Upgate payment transaction declined"
    );
  }

  const data = await response.json();
  return data;
}
