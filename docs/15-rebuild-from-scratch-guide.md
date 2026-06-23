# 15 — Rebuild From Scratch Guide

> **Premise:** all source code is lost. This is a step-by-step blueprint for an experienced developer to rebuild Lucy from nothing, using only this documentation. Follow the phases in order — each builds on the previous.
>
> Reference the other docs for detail: [05 Database](05-database-documentation.md), [06 API](06-api-documentation.md), [08 AI](08-ai-system-documentation.md), [17 Env Vars](17-environment-variables.md).

---

## Phase 0 — Provision Accounts

Create accounts and capture credentials for all services ([18 — Third-Party Services](18-third-party-services.md)):

| Service | What to create | Credentials to capture |
|---|---|---|
| **Clerk** | Application | publishable key, secret key, webhook signing secret |
| **Supabase** | Project | URL, anon key, service-role key |
| **OpenRouter** | Account + API key | API key |
| **Stripe** | Account + 2 recurring products (Premium $14.99, Ultimate $39.99) | secret key, webhook secret, 2 price ids |
| **Cloudflare R2** | Bucket + API token | account id, access key, secret, bucket, public URL |
| **Upstash** | Redis database | REST URL + token |
| **OpenAI** (optional) | API key | API key (for TTS) |

---

## Phase 1 — Scaffold the App

```bash
npx create-next-app@latest lucy --typescript --app --eslint
cd lucy
```

Install dependencies (see [03 — Tech Stack](03-tech-stack.md) for the full list and versions):
```bash
npm i @clerk/nextjs @clerk/ui @supabase/supabase-js stripe \
  @aws-sdk/client-s3 @aws-sdk/s3-request-presigner \
  @upstash/redis @upstash/ratelimit \
  @tanstack/react-query zustand react-hook-form @hookform/resolvers zod \
  lucide-react framer-motion sonner next-themes tailwind-merge clsx server-only \
  @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select # …etc
npm i -D tailwindcss @tailwindcss/postcss
```

Configure:
- `tsconfig.json`: path alias `@/*` → `./src/*`, strict mode.
- `next.config.ts`: security headers (HSTS, CSP, X-Frame-Options DENY, Permissions-Policy) + image `remotePatterns` for Clerk, DiceBear, Supabase, R2.
- Tailwind v4 via `@theme` in `src/styles/globals.css`.
- `.env.local` from [17 — Environment Variables](17-environment-variables.md).

---

## Phase 2 — Database

Recreate the schema from [05 — Database](05-database-documentation.md). Author SQL migrations in order:

1. **`0001_init`** — enums + base tables (profiles, characters, user_characters, conversations, messages, memories, user_settings, subscriptions, coin_balances, coin_ledger, action_costs, media_assets, notifications, billing_records) + indexes. Seed `action_costs` (text=1, image=20, voice_minute=10).
2. **`0002_rls`** — `current_profile_id()`, `is_admin()` helpers; enable RLS; owner-only / admin / world-readable policies.
3. **`0003_functions`** — `spend_coins`, `grant_coins` (SECURITY DEFINER, idempotent), `coin_balance_check` view.
4. **`0004_security_hardening`** — `is_banned`/`banned_reason` on profiles + extra policies.
5. **`0005_seed_characters`** — initial catalog.
6. **user-character branch** — `created_by`, `visibility` on characters; `reports` table + `report_status` enum.
7. **`0015_v2_platform`** — `stripe_customer_id`/`stripe_subscription_id`, `conversations.summary`, `tenants`, `analytics_events`, `push_subscriptions`, `count_user_messages_today()`, `billing_records.external_ref`. Seed the `lucy` tenant.
8. **`0016_rls_v2_tables`** + **`0017` repair** as needed.

Then configure **Supabase third-party auth** to trust Clerk's JWT (so `auth.jwt()->>'sub'` resolves). Generate types into `src/types/database.ts`.

---

## Phase 3 — Clerk Integration

1. Wrap the root layout in `ClerkProvider`.
2. Create `sign-in/[[...sign-in]]` and `sign-up/[[...sign-up]]` catch-all pages.
3. Configure the Clerk **JWT/session template** to include `metadata.role`.
4. Build the **Clerk webhook** (`/api/webhooks/clerk`): verify Svix signature; on `user.created` upsert profile + subscription(free) + settings and `grant_coins(signup_bonus, idem=signup:<id>)`; on `user.updated` sync `is_admin` from `public_metadata.role`; on `user.deleted` delete the profile (cascade). Exclude this route from auth middleware.
5. Implement `lib/auth/` gates: `isAdminUser`/`isAdminRequest`, `ensureNotBanned`/`bannedResponse`, and `ensureProfile`.

---

## Phase 4 — Core Libraries

Recreate `src/lib/` ([04 — Folder Structure](04-folder-structure.md)):
- **`supabase/`**: `client` (anon), `server` (anon+JWT), `admin` (service role).
- **`rate-limit.ts`**: Upstash sliding-window limiters (api 60/60s, subscription 10/60s, webhook 20/10s); prod-503 when unconfigured.
- **`validation/`**: Zod schemas + `parseBody`.
- **`coins/spend.ts`**: wrappers over `spend_coins`/`grant_coins`; `coins-config.ts` defaults.
- **`plan-limits.ts`**: `PLAN_LIMITS`, `assertCanSendMessage`, `assertCanCreateCharacter`, `resolveModelForPlan`, `getUserPlan`.
- **`data/`**: query modules for chat, memories, settings, economy/model settings, admin aggregates.
- **`stripe.ts`**, **`billing/sync-subscription.ts`**, **`storage/r2.ts`**, **`voice/tts.ts`**, **`analytics/track.ts`**, **`security/audit.ts`**, **`tenant.ts`**.

---

## Phase 5 — AI System

Recreate `src/lib/ai/` per [08 — AI System](08-ai-system-documentation.md):
- **`openrouter.ts`**: model-list fetch + 5-min cache + test harness.
- **`character-chat.ts`**: `buildSystemPrompt` (custom-or-default + `SAFETY_RULES` + summary + memories), `streamCharacterReply`/`generateCharacterReply` (OpenRouter, temp 0.85, max_tokens 300, stream, usage.include).
- **`prompt-safety.ts`**: `SAFETY_RULES`, `sanitizeUserText`, `formatMemoriesForPrompt`, injection patterns.
- **`memory-extract.ts`**, **`relationship.ts`**, **`image-gen.ts`**.
- **`security/`**: `sanitize`, `injection`, `moderation`, `output-guard` (exposed as `guardChatInput`/`guardOutput`).

---

## Phase 6 — API Routes

Build every endpoint in [06 — API](06-api-documentation.md). Start with the critical path:
1. `POST /api/chat/start`
2. `POST /api/chat/[id]/messages` (the full guarded, coin-spending, streaming pipeline)
3. `GET /api/chat/conversations`, `GET /api/chat/[id]/messages`
Then characters, memories, subscription (+Stripe webhook), upload, voice, coins, notifications, reports, push, and the full `admin/*` set (each gated by `isAdminRequest`).

---

## Phase 7 — Frontend

Per [04 — Folder Structure](04-folder-structure.md):
- Provider stack: Clerk → Theme → TanStack Query → Toaster.
- Route groups: `(marketing)`, `(landing)`, `(dashboard)`, `(admin)` (with admin gate in its layout).
- `components/ui/` Radix primitives; feature components (chat, character, subscription, voice, admin).
- Zustand stores (`chat-store`, `ui-store`); hooks (`use-flags`, `use-is-admin`, `use-ai-models`).
- Constants: `plans.ts` (Free/Premium/Ultimate as documented), `routes.ts`, `feature-flags.ts`.

---

## Phase 8 — Billing

- Map Stripe price ids → plans (`planFromStripePriceId`).
- `POST /api/subscription/upgrade` → Checkout session (metadata `profile_id`, `plan`); dev-bypass path.
- `POST /api/subscription/cancel` → `cancel_at_period_end`.
- **Stripe webhook**: `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.paid` (idempotent billing record + `grant_coins(allowance, idem=sub_grant:<invoiceId>)`).
- `syncSubscription` as the single state writer.

---

## Phase 9 — Wire Up & Verify

1. Point Clerk + Stripe webhooks at the deployed domain.
2. Set all env vars; `BILLING_DEV_BYPASS` off in prod; Upstash configured.
3. **Smoke test** (see [Verification] in any guide): sign up → profile + 100 coins created → start chat → send message (coin debited, streamed reply) → upgrade (Stripe checkout → plan + coins) → admin panel loads for an admin.

---

## Phase 10 — Acceptance Criteria

The rebuild is complete when:
- [ ] New signup auto-creates profile + free subscription + 100 coins.
- [ ] Chat streams a safe, in-character reply and debits 1 coin (refunded on failure).
- [ ] Daily/plan limits and ban gate enforce correctly.
- [ ] Memory is extracted and re-injected; relationship advances.
- [ ] Stripe checkout upgrades the plan and grants monthly coins (idempotently).
- [ ] RLS prevents cross-user data access.
- [ ] Admin panel manages users, characters, models, economy, and shows analytics.
- [ ] Security headers, rate limits, and AI guards are active.

> **Estimated effort (⚠️):** for an experienced full-stack developer familiar with this stack, a faithful rebuild is roughly **4–8 weeks**, dominated by the chat pipeline, admin panel, and billing correctness.
