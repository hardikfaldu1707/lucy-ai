import { z } from "zod";

export const paymentFormSchema = z.object({
  cardholderName: z
    .string()
    .trim()
    .min(2, "Cardholder name must be at least 2 characters")
    .max(100, "Name is too long"),
  cardNumber: z
    .string()
    .trim()
    .min(15, "Card number must be 15 or 16 digits")
    .max(22, "Card number is too long") // matches spaced formatting like "xxxx xxxx xxxx xxxx"
    .regex(/^[0-9\s]+$/, "Card number must contain only numbers"),
  expiryDate: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, "Expiry date must be MM/YY"),
  cvc: z
    .string()
    .trim()
    .min(3, "CVC must be at least 3 digits")
    .max(4, "CVC must be at most 4 digits")
    .regex(/^[0-9]+$/, "CVC must contain only numbers"),
});

export type PaymentFormInput = z.infer<typeof paymentFormSchema>;
