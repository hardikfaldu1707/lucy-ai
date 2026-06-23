# 06 — API Documentation

> All endpoints are **Next.js route handlers** under [src/app/api/](../src/app/api/). They run server-side and hold all secrets.

---

## 1. Conventions

### Authentication
Every protected route extracts the Clerk session server-side:
```ts
const { userId, sessionClaims } = await auth();
if (!userId) return new NextResponse("Unauthorized", { status: 401 });
```
Admin routes additionally call `isAdminRequest()` ([src/lib/auth/require-admin.ts](../src/lib/auth/require-admin.ts)). Most user routes also call `bannedResponse()` ([require-not-banned.ts](../src/lib/auth/require-not-banned.ts)).

### Common middleware chain (write routes)
`auth()` → `checkUserRateLimit(userId)` → `ensureProfile()` → `bannedResponse()` → input validation (`parseBody` + Zod) → business logic.

### Standard error codes
| Code | Meaning |
|---|---|
| `401 Unauthorized` | No/invalid Clerk session |
| `403 Forbidden` | Banned user, or non-admin hitting an admin route |
| `402 Payment Required` | Out of coins **or** daily message/plan limit reached |
| `404 Not Found` | Resource missing or not owned by caller |
| `422 Unprocessable` | Input failed validation **or** blocked by AI moderation/injection guard |
| `429 Too Many Requests` | Rate limit exceeded |
| `400 Bad Request` | Invalid webhook signature / malformed request |
| `500` / `503` | Server error / required service (e.g. rate limiter, webhook secret) unavailable |

### Rate limits ([src/lib/rate-limit.ts](../src/lib/rate-limit.ts))
| Limiter | Limit | Applied to |
|---|---|---|
| `apiLimiter` | 60 req / 60 s per user | most write routes (`checkUserRateLimit`) |
| `subscriptionLimiter` | 10 req / 60 s per user | subscription mutations |
| `webhookLimiter` | 20 req / 10 s per IP | webhooks |

> In **production**, if Upstash is not configured, rate-limited routes return **503** rather than running unprotected.

---

## 2. User & Account

### `GET /api/me`
- **Auth:** required. **Returns:** `{ isAdmin: boolean }`.

### `GET /api/flags`
- **Auth:** optional. **Returns:** `{ flags: Record<string, boolean> }` — feature flags from `app_settings` for gating UI.

### `POST /api/onboarding/complete`
- **Auth:** required. **Body:** `{ characterSlug?: string }`. **Returns:** `{ ok: true }`. Stores onboarding completion in `user_settings.extra`.

---

## 3. Characters

### `GET /api/characters`
- **Auth:** optional. **Returns:** `{ characters: [] }` — published/public catalog.

### `POST /api/characters`
- **Auth:** required. **Rate-limited. Ban-checked.** Gated by `user_created_characters` flag and plan character limit.
- **Body:** `{ name, tagline?, description?, avatarUrl?, tags?, personality?, aiModel?, systemPrompt?, gender?, style?, age? }`.
- **Behavior:** always forces `visibility: 'private'`, `createdBy: userId`; validates `aiModel` against the allow-list.
- **Returns:** `201 { character }`. **Errors:** `402` (plan limit), `422` (validation/model).

### `GET /api/characters/mine`
- **Auth:** required. **Returns:** `{ characters: [] }` — the caller's own characters.

### `PATCH /api/characters/[id]`
- **Auth:** required, **ownership enforced.** **Body:** `{ aiModel?: string | null }` (only model editable today).
- **Returns:** `{ character }`. **Errors:** `404` (not owner), `422` (invalid model).

### `POST /api/characters/[id]/favorite`
- **Auth:** required. Toggles favorite. **Returns:** `{ isFavorite: boolean }`.

### `GET /api/ai-models`
- **Auth:** not required. **Returns:** `{ models: [{id,label,provider}], defaultModel }` — user-visible allow-list.

---

## 4. Chat

### `POST /api/chat/start`
- **Auth:** required. **Rate-limited. Ban-checked.** **Body:** `{ characterSlug: string }`.
- Creates or returns the existing conversation for `(user, character)`.
- **Returns:** `{ conversationId, characterName, characterAvatar }`. **Errors:** `404` (character missing).

### `GET /api/chat/conversations`
- **Auth:** required. **Returns:** `{ conversations: [] }` (ordered by `last_message_at`).

### `GET /api/coins/balance`
- **Auth:** required. **Returns:** `{ balance: number }` — current user's coin balance (RLS-scoped).

### `DELETE /api/chat/[id]`
- **Auth:** required. **Ban-checked.** Owner-only.
- Deletes the conversation and all messages (cascade). Resets `user_characters.message_count` for that character pair.
- **Returns:** `{ ok: true }`. **Errors:** `404` (not found or not owned).

### `GET /api/chat/[id]/messages`
- **Auth:** required. **Ban-checked.** **Returns:** `{ messages: [] }` for the conversation.

### `POST /api/chat/[id]/messages` ⭐ (core path)
- **Auth:** required. **Rate-limited. Ban-checked.** Daily-limit checked (`assertCanSendMessage`).
- **Body:** `{ content: string }` (validated by `chatMessageSchema`).
- **Response:** **streaming NDJSON** (`Content-Type: application/x-ndjson`), one JSON object per line:
  | `type` | payload |
  |---|---|
  | `user` | the persisted user message |
  | `delta` | `{ text }` — incremental reply token(s) |
  | `replace` | `{ text }` — output guard replaced unsafe content |
  | `done` | the persisted assistant message |
  | `error` | `{ error }` |
- **Flow:** moderation/injection guard → persist user msg → **spend 1 coin** (idempotency `chat:userId:msgId`) → stream from OpenRouter → output guard → persist reply, update preview/relationship, log usage, extract memories.
- **Errors:** `402` (limit/coins), `422` (blocked input — *no coin charged*), `404` (conversation), `500` (save failure → **coin refunded, user msg deleted**).
- **Security:** repeated guard violations increment an abuse counter and **auto-suspend** the account past `ABUSE_SUSPEND_THRESHOLD`.

### `POST /api/chat/[id]/image`
- **Auth:** required. **Requires Ultimate plan** + `image_generation` flag. **Spends 20 coins.**
- **Body:** `{ prompt?: string }`. **Returns:** `{ imageUrl, message }` (inserts an `image`-type message).

---

## 5. Memories

### `GET /api/memories`
- **Auth:** required. **Query:** `?type=<memory_type>&search=<string>`. **Returns:** `{ memories: [] }`.

### `POST /api/memories`
- **Auth:** required. **Body:** `{ type, title, content, characterId? }`. **Returns:** `{ memory }`.

### `PATCH /api/memories/[id]`
- **Auth:** required. **Body:** `{ title?, content?, isPinned?, type? }`. **Returns:** `{ memory }`.

### `DELETE /api/memories/[id]`
- **Auth:** required. **Returns:** `{ ok: true }`.

---

## 6. Notifications, Voice, Upload, Push, Reports

### `GET /api/notifications`
- **Auth:** required. **Returns:** `{ notifications: [] }`.

### `POST /api/voice/tts`
- **Auth:** required. **Requires Premium/Ultimate** + voice flag. **Rate-limited. Spends voice coins.**
- **Body:** `{ text: string }`. **Returns:** audio payload (base64/MP3). Requires `OPENAI_API_KEY`; returns null/feature-off otherwise.

### `POST /api/upload`
- **Auth:** required. **Rate-limited.** **Body:** `{ contentType, size, characterId? }`.
- Validates type (`image/*` or `video/*`) and size (**max 10 MB**); creates a `media_assets` row.
- **Returns:** `{ uploadUrl (presigned PUT), publicUrl, key }`. Browser then PUTs directly to R2.

### `POST /api/push/subscribe`
- **Auth:** required. **Body:** `{ endpoint, p256dh, auth }`. Upserts into `push_subscriptions`. **Returns:** `{ ok: true }`.

### `POST /api/reports`
- **Auth:** required. **Body:** `{ category?, reason?, characterId?, conversationId? }`. `reporter_id` forced to caller. **Returns:** `201 { success: true }`.

---

## 7. Subscription

### `POST /api/subscription/upgrade`
- **Auth:** required. **Rate-limited (subscription limiter).** **Body:** `{ plan: 'free'|'premium'|'ultimate' }`.
- `free` → cancels Stripe sub. Paid → creates a **Stripe Checkout session** (metadata `profile_id`, `plan`); or dev-bypass sync if `BILLING_DEV_BYPASS`/non-prod.
- **Returns:** `{ checkoutUrl: string|null, devMode?: boolean }`. Tracks `upgrade_started`.

### `POST /api/subscription/cancel`
- **Auth:** required. Sets `cancel_at_period_end = true` (and on Stripe if configured). **Returns:** `{ ok: true }`.

---

## 8. Admin API (all require `isAdminRequest()` → `403` otherwise)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/admin/users` | GET | Paginated users (`?search`, `?page`) with stats |
| `/api/admin/users/[id]` | GET | User detail |
| `/api/admin/users/[id]` | PATCH | `{ plan?, grantCoins?, ban?:{reason?}, unban? }` |
| `/api/admin/characters` | GET | All characters (incl. unpublished) |
| `/api/admin/characters` | POST | Create character (public, model, system prompt) |
| `/api/admin/characters/[id]` | PATCH | Update any field |
| `/api/admin/characters/[id]` | DELETE | Delete + cascade |
| `/api/admin/memories` | GET | Paginated memories (all users) |
| `/api/admin/reports` | GET | `?status=open\|reviewing\|resolved\|dismissed` |
| `/api/admin/reports/[id]` | PATCH | `{ status }` |
| `/api/admin/settings` | GET | `{ flags, economy }` |
| `/api/admin/settings` | PATCH | `{ key, value }` — set a flag or economy value |
| `/api/admin/subscriptions` | GET | Plan breakdown + MRR |
| `/api/admin/payments` | GET | Paginated billing records |
| `/api/admin/usage` | GET | Usage by model/character + popularity |
| `/api/admin/stats` | GET | Platform overview + top characters |
| `/api/admin/cohorts` | GET | Cohort retention + funnel |
| `/api/admin/unit-economics` | GET | Margin by plan + top spenders |
| `/api/admin/ai-models` | GET | All OpenRouter models + settings |
| `/api/admin/ai-models` | PATCH | `{ userAllowedModels?, defaultModel? }` |
| `/api/admin/ai-models/test` | POST | `{ model }` → test a model with a sample prompt |

**Security:** admin routes use the service-role client and bypass RLS. Authorization is the **only** gate — `isAdminRequest()` must run on every one (verified present in current code). Adding a new admin route without this check is the most likely future vulnerability.

---

## 9. Webhooks (no Clerk auth; signature-verified)

### `POST /api/webhooks/clerk`
- **Verification:** Svix signature via `verifyWebhook` (`CLERK_WEBHOOK_SIGNING_SECRET`). Rate-limited per IP.
- **Events:**
  | Event | Action |
  |---|---|
  | `user.created` | upsert profile; create `subscriptions`(free)+`user_settings`; `grant_coins(signup_bonus, idem=signup:userId)`; track `signup` |
  | `user.updated` | upsert profile; sync `is_admin` from `public_metadata.role` (clears if removed) |
  | `user.deleted` | delete profile (FK cascade removes all owned data) |
- **Returns:** `200 "ok"` or `400`/`500`.

### `POST /api/webhooks/stripe`
- **Verification:** `stripe.webhooks.constructEvent` (`STRIPE_WEBHOOK_SECRET`). Missing secret → `500`; bad signature → `400`.
- **Events:**
  | Event | Action |
  |---|---|
  | `checkout.session.completed` | retrieve sub period end; `syncSubscription(active, …)` |
  | `customer.subscription.updated` | resolve plan from price id; re-sync status/period |
  | `customer.subscription.deleted` | downgrade to `free`, status `cancelled` |
  | `invoice.paid` | upsert `billing_records` (idempotent on invoice id); `grant_coins(monthly allowance, idem=sub_grant:invoiceId)`; track `upgrade_completed` |
- **Returns:** `{ received: true }`.

> **Idempotency:** both webhooks are safe to replay — Clerk uses upserts + signup idempotency key; Stripe uses unique `external_ref` and `sub_grant:` idempotency keys.

---

## 10. Security Considerations (cross-cutting)

- **Coin spend happens server-side, atomically, before the AI call** — a client cannot bypass the charge, and a failed reply refunds it.
- **Input is moderated/injection-checked before any spend or persistence.**
- **Ownership is enforced** on every per-user resource (`getConversationById(id, userId)` patterns), not just by RLS.
- **No endpoint trusts client-provided identity** — `profile_id`/`reporter_id`/`createdBy` are always overwritten with `userId`.
- **Webhooks must be excluded from Clerk auth middleware** and rely solely on signature verification.
