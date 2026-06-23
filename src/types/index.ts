export type SubscriptionPlan = "free" | "premium" | "ultimate";

export type MemoryType = "personality" | "relationship" | "semantic" | "episodic";

export type MessageType = "text" | "voice" | "image" | "system";

export type RelationshipStatus =
  | "stranger"
  | "acquaintance"
  | "friend"
  | "close"
  | "partner";

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  plan: SubscriptionPlan;
  emailVerified: boolean;
  createdAt: string;
}

export interface Character {
  id: string;
  name: string;
  tagline: string;
  description: string;
  avatarUrl: string;
  galleryUrls: string[];
  category: string;
  tags: string[];
  personality: string[];
  voicePreviewUrl?: string;
  relationshipStatus: RelationshipStatus;
  isFavorite: boolean;
  messageCount: number;
}

export interface Conversation {
  id: string;
  characterId: string;
  characterName: string;
  characterAvatar: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  type: MessageType;
  content: string;
  mediaUrl?: string;
  duration?: number;
  createdAt: string;
  isStreaming?: boolean;
}

export interface MemoryItem {
  id: string;
  type: MemoryType;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: "active" | "cancelled" | "past_due" | "trialing";
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface BillingRecord {
  id: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed";
  date: string;
  invoiceUrl?: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  href?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
