import { z } from "zod";
import {
  maxUploadBytesForContentType,
  maxUploadLabelForContentType,
} from "@/lib/storage/upload-limits";

// Centralized request-body schemas for API routes. Every schema enforces hard
// length/enum bounds so a route never processes unbounded or malformed input
// (defense against payload abuse, DB bloat, and prompt-stuffing). Keep these in
// sync with the domain types in src/types and the DB column limits.

export const requestMediaSchema = z.object({
  type: z.enum(["image", "video"]),
  prompt: z.string().trim().min(1).max(500),
  saveUserMessage: z.boolean().optional().default(true),
});
export type RequestMediaInput = z.infer<typeof requestMediaSchema>;

export const chatCharacterPhotoSchema = z.object({
  index: z.number().int().min(0),
});
export type ChatCharacterPhotoInput = z.infer<typeof chatCharacterPhotoSchema>;

export const chatMessageSchema = z
  .object({
    content: z.string().trim().max(4000).default(""),
    type: z.enum(["text", "image"]).optional().default("text"),
    mediaUrl: z.string().url().max(2048).optional(),
  })
  .refine((data) => data.content.length > 0 || data.mediaUrl, {
    message: "content or mediaUrl is required",
  });
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export const startChatSchema = z.object({
  characterSlug: z.string().trim().min(1).max(160),
});

export const guestChatMessageSchema = z.object({
  characterSlug: z.string().trim().min(1).max(160),
  content: z.string().trim().min(1).max(4000),
});

export const contactSubmissionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  message: z.string().trim().min(10).max(4000),
});
export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;

// Image prompt is optional (falls back to a character-derived default); when
// present it is also run through guardChatInput before image generation.
export const imageRequestSchema = z.object({
  prompt: z.string().trim().max(1000).optional(),
});

export const memoryTypeSchema = z.enum([
  "personality",
  "relationship",
  "semantic",
  "episodic",
]);

export const createMemorySchema = z.object({
  type: memoryTypeSchema,
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(500),
  characterId: z.string().max(128).optional(),
});

export const updateMemorySchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    content: z.string().trim().min(1).max(500).optional(),
    type: memoryTypeSchema.optional(),
    isPinned: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "no fields to update" });

// Shape produced by the memory-extraction LLM call (json_object response).
export const extractedMemoriesSchema = z.object({
  memories: z
    .array(
      z.object({
        type: z.string().optional(),
        title: z.string().optional(),
        content: z.string().optional(),
      }),
    )
    .max(5)
    .optional()
    .default([]),
});

const characterAppearanceSchema = z.object({
  ethnicity: z.string().trim().max(40).optional(),
  hairStyle: z.string().trim().max(40).optional(),
  hairColor: z.string().trim().max(40).optional(),
  bodyType: z.string().trim().max(40).optional(),
  outfit: z.string().trim().max(40).optional(),
});

export const createCharacterSchema = z.object({
  name: z.string().trim().min(1).max(80),
  tagline: z.string().trim().max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  avatarUrl: z.string().url().max(2048),
  tags: z.array(z.string().trim().max(40)).max(20).optional(),
  personality: z.array(z.string().trim().max(40)).max(20).optional(),
  aiModel: z.string().max(128).nullable().optional(),
  systemPrompt: z.string().max(5000).nullable().optional(),
  gender: z.enum(["female", "trans"]).optional(),
  style: z.enum(["realistic", "anime"]).optional(),
  age: z.number().int().min(18).max(120).optional(),
  relationship: z.string().trim().max(40).optional(),
  appearance: characterAppearanceSchema.optional(),
  voicePersonaId: z.string().trim().max(40).optional(),
});

export const updateUserCharacterSchema = createCharacterSchema.partial();
export type UpdateUserCharacterInput = z.infer<typeof updateUserCharacterSchema>;

export const subscriptionUpgradeSchema = z.object({
  plan: z.enum(["free", "premium", "ultimate"]),
});

export const coinPurchaseSchema = z.object({
  packId: z.string().uuid(),
});

export const adminCoinPackSchema = z.object({
  slug: z.string().trim().min(1).max(40).regex(/^[a-z0-9-]+$/),
  label: z.string().trim().min(1).max(80),
  coinAmount: z.number().int().positive().max(1000000),
  priceCents: z.number().int().positive().max(100000000),
  currency: z.string().trim().max(8).optional(),
  stripePriceId: z.string().trim().max(128).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  badge: z.string().trim().max(40).nullable().optional(),
});

export const adminCoinPackPatchSchema = adminCoinPackSchema.partial();

export const profileLanguageSchema = z.enum(["en", "es", "ja"]);
export type ProfileLanguage = z.infer<typeof profileLanguageSchema>;

export const updateProfileSchema = z
  .object({
    username: z.string().trim().min(1).max(40).optional(),
    avatarUrl: z.string().url().max(2048).optional(),
    language: profileLanguageSchema.optional(),
    notifyEmail: z.boolean().optional(),
    notifyPush: z.boolean().optional(),
    notifyMarketing: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "no fields to update" });
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const mediaScopeSchema = z.enum(["user", "character", "platform"]);

export const uploadMetaSchema = z
  .object({
    contentType: z
      .string()
      .regex(/^(image|video)\/[a-z0-9.+-]+$/i, "Only image/* and video/* uploads are allowed"),
    size: z.number().int().positive(),
    characterId: z.string().max(128).optional(),
    scope: mediaScopeSchema.optional().default("user"),
    platformName: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens")
      .max(80)
      .optional(),
  })
  .superRefine((data, ctx) => {
    const max = maxUploadBytesForContentType(data.contentType);
    if (data.size > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `File too large (max ${maxUploadLabelForContentType(data.contentType)})`,
        path: ["size"],
      });
    }
  });
