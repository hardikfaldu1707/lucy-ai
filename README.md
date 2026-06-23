# Lucy AI

An AI‑companion ("AI girlfriend") SaaS — users chat with AI characters, each powered by a
configurable LLM. Includes a full **admin panel** to manage characters, users, billing,
storage and AI cost/usage analytics, plus a **user studio** to create your own private AI
girl.

> Private freelance project — not open source. Internal documentation for development and
> handover.

---

## Tech stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) · React 19 · TypeScript |
| Styling | Tailwind CSS · shadcn/ui (Radix primitives) · Framer Motion |
| Auth | **Clerk** (sessions, roles, webhooks) |
| Database | **Supabase** (Postgres + Row‑Level Security) |
| AI | **OpenRouter** (one API → GPT / Claude / Gemini / Llama / Mistral …) |
| Object storage | **Cloudflare R2** (S3‑compatible, via AWS SDK) — character images + uploads |
| Rate limiting | **Upstash Redis** |
| Client state | TanStack Query · Zustand |
| Forms / validation | React Hook Form · Zod |
| Notifications | Sonner |

---

## How it works (architecture)

```
Browser ──▶ Next.js (App Router)
                │
                ├─ Clerk proxy .............. auth + /admin role gate
                ├─ Route handlers (/api/*) .. server logic
                │     ├─ OpenRouter ......... character chat replies
                │     ├─ Supabase ........... data (RLS + service-role)
                │     └─ Cloudflare R2 ...... image/file storage
                │
                └─ Clerk webhook ─▶ Supabase profiles (user sync)
```

- **Auth**: Clerk. Admin access is gated by the Clerk session claim `metadata.role === "admin"`
  in [`src/proxy.ts`](src/proxy.ts) and re‑checked in every admin API via
  [`src/lib/auth/require-admin.ts`](src/lib/auth/require-admin.ts).
- **Users**: synced Clerk → Supabase `profiles` by the webhook
  ([`src/app/api/webhooks/clerk/route.ts`](src/app/api/webhooks/clerk/route.ts)), with a
  safety‑net fallback in [`src/lib/ensure-profile.ts`](src/lib/ensure-profile.ts).
- **Chat**: messages persist in Supabase; replies come from OpenRouter via
  [`src/lib/ai/character-chat.ts`](src/lib/ai/character-chat.ts). Each character can use its
  own model (`characters.ai_model`) and its own system prompt (`characters.system_prompt`).
- **Two Supabase clients**: an RLS‑scoped client forwarding the Clerk token
  ([`src/lib/supabase/server.ts`](src/lib/supabase/server.ts)) for user requests, and a
  service‑role client ([`src/lib/supabase/admin.ts`](src/lib/supabase/admin.ts)) for trusted
  server code (webhooks, admin, usage logging).

---

## Features

### Chat & characters
- Real AI chat with per‑character **model** and **system prompt** ("command line").
- Per‑reply **token + cost logging** (OpenRouter `usage`) → `ai_usage_log`.
- Coins economy: signup/login bonuses, per‑plan monthly allowance, per‑action spend.

### Admin panel (`/admin`, admin role only)
- **Characters** — full CRUD: name, tagline, description, tags, personality, **AI model**,
  **system prompt**, visibility, published flag, **R2 image upload**.
- **Users** — real list of every signed‑up user (search + pagination); per‑user detail with
  profile, subscription, billing, coin balance + ledger, memories, relationships — change
  plan, grant coins. **No chat access** (private by design).
- **Usage & cost** — per‑model cost, per‑character cost, and a "most users chatting"
  leaderboard.
- **Dashboard** — live totals (users, paid users, messages, characters, revenue).

### User studio
- Users create their own AI girl ([`/dashboard/characters/new`](src/app/(dashboard)/dashboard/characters/new/page.tsx)).
- User‑created girls are **private to the creator** (server‑enforced); admin‑created girls are
  public and appear on the DB‑driven home page.

### Storage (Cloudflare R2)
- Presigned direct‑to‑R2 uploads ([`/api/upload`](src/app/api/upload/route.ts)); uploads are
  tracked in `media_assets` for storage accounting.
- Admin **Storage** page ([`/admin/storage`](src/app/(admin)/admin/storage/page.tsx)) lists,
  uploads, and deletes files (user / character / platform scopes).
- Verify R2 credentials: `npm run test:r2` — see [`docs/20-r2-storage-testing.md`](docs/20-r2-storage-testing.md).

### Privacy
- **Chat is private at the DB level.** Migration `0010` removes admin read access to
  `messages`/`conversations`; analytics use a content‑free aggregate only. Admins can see all
  *account* data but never message content.

---

## Project structure

```
src/
├── app/
│   ├── (landing)/        # public marketing + home/explore + create page
│   ├── (dashboard)/      # signed-in app (chat, characters, my-girls, profile…)
│   ├── (admin)/admin/    # admin panel (characters, users, usage, …)
│   └── api/              # route handlers (see API table below)
├── components/
│   ├── ui/               # shadcn/ui primitives
│   ├── admin/            # admin forms (character-form, …)
│   ├── character/        # user-character-form, cards
│   ├── chat/ home/ …     # feature components
├── lib/
│   ├── ai/               # character-chat (OpenRouter)
│   ├── data/             # server data layer (chat, admin-*, ai-usage, characters-public…)
│   ├── storage/          # r2.ts (Cloudflare R2)
│   ├── supabase/         # server (RLS) + admin (service-role) clients
│   └── auth/             # require-admin
├── constants/            # ai-models, routes, *-characters
├── store/ providers/ hooks/ types/
└── ...
supabase/migrations/      # 0001 … 0016 (schema, RLS, seed, billing, economy)
```

---

## Setup

### 1. Prerequisites
- Node 20+, npm
- A **Clerk** app, a **Supabase** project, an **OpenRouter** key, a **Cloudflare R2** bucket,
  and (optional in dev) an **Upstash Redis** instance.

### 2. Install & env

```bash
npm install
cp .env.example .env.local   # fill in the values below
```

Environment variables (`.env.example` has the full list with comments):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | App base URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk auth |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk → Supabase user sync webhook |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server‑only; bypasses RLS (webhooks/admin/usage) |
| `OPENROUTER_API_KEY` | AI chat replies |
| `OPENROUTER_MODEL` | Fallback model when a character has none set |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | Cloudflare R2 storage |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (**required in production**) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PREMIUM`, `STRIPE_PRICE_ULTIMATE` | Stripe billing + subscription renewals |

### 3. Database

Apply all migrations to Supabase (CLI `supabase db push`, or paste each file in the SQL
editor in order). The seed migration populates the starter character catalog:

```
0001_init                       core schema (tables, enums, indexes)
0002_rls                        Row-Level Security + is_admin()
0003_functions                  grant_coins / spend_coins RPCs
0004_security_hardening
0005_seed_characters            starter catalog (run this so the home page has data)
0006_messages_rls_hardening
0007_character_ai_model         characters.ai_model (per-character model)
0008_character_config_and_ownership   system_prompt, created_by, visibility + read RLS
0009_ai_usage_log               per-reply token/cost log (admin-only)
0010_chat_privacy_hardening     hard DB block on admin reading chat content
0011_reports                    reports table + report_status enum (moderation)
0012_app_settings               key/value store for feature flags
0013_character_filters          characters.gender / style / age (home filters)
0014_profile_ban                profiles.is_banned / banned_reason (suspension)
0015_v2_platform                Stripe columns, tenants, analytics, push, conversation summary
0016_rls_v2_tables              RLS for analytics_events, push_subscriptions, tenants
0017_repair_missing_migrations  idempotent replay of 0006–0014 if remote DB is behind
0017_security_events            security_events audit table (admin read-only)
0018_profiles_column_guard      trigger blocking self-modify of is_admin/plan/is_banned
0019_count_messages_hardening   revoke count_user_messages_today from authenticated
0020_performance_indexes        hot-path indexes (messages, memories, characters, usage)
0021_admin_usage_aggregates     SQL aggregate functions for admin analytics
```

> If the remote DB only has migrations through 0004, run **0017_repair_missing_migrations**
> before 0015/0016 features. Apply **0015** and **0016** before deploying V2
> billing/analytics features. Regenerate
> [`src/types/database.ts`](src/types/database.ts) after applying migrations
> (`npx supabase gen types typescript --project-id <id> > src/types/database.ts`).

> **Making yourself an admin** (either method works):
>
> 1. **Clerk Dashboard** → Users → your user → **Public metadata** → `{ "role": "admin" }`
>    Then **Sessions** → **Customize session token** → add claim:
>    `"metadata": "{{user.public_metadata}}"` (so `proxy.ts` sees the role in the JWT).
>
> 2. **Supabase SQL** (quick dev fix):  
>    `update profiles set is_admin = true where email = 'you@example.com';`
>
> Sign out and sign in after changing Clerk metadata. The webhook mirrors Clerk role to
> `profiles.is_admin`; the app checks **both** the session claim and `profiles.is_admin`.

### 4. Run

```bash
npm run dev      # http://localhost:3000
```

---

## API routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/chat/start` | POST | user | Create/get a conversation |
| `/api/chat/conversations` | GET | user | List conversations |
| `/api/chat/[id]/messages` | GET/POST | user | Read / send messages (POST → AI reply + usage log) |
| `/api/characters` | GET/POST | public / user | Home catalog · create own (private) girl |
| `/api/characters/mine` | GET | user | The user's own created girls |
| `/api/upload` | POST | user | Presigned R2 upload URL |
| `/api/me` | GET | user | Current user profile + admin flag |
| `/api/coins/login-bonus` | POST | user | Per-session login coin bonus |
| `/api/subscription/upgrade` · `/cancel` | POST | user | Stripe checkout or plan changes |
| `/api/memories` · `/[id]` | GET/POST/PATCH/DELETE | user | Memory center CRUD |
| `/api/voice/tts` | POST | user | Text-to-speech (coin spend) |
| `/api/chat/[id]/image` | POST | user | In-chat image generation |
| `/api/push/subscribe` | POST | user | Web push subscription |
| `/api/onboarding/complete` | POST | user | Mark onboarding done |
| `/api/admin/characters` · `/[id]` | GET/POST/PATCH/DELETE | admin | Character CRUD |
| `/api/admin/users` · `/[id]` | GET/PATCH | admin | User list/detail · plan/coins |
| `/api/admin/stats` | GET | admin | Dashboard overview |
| `/api/admin/usage` | GET | admin | Model + character cost/usage |
| `/api/admin/subscriptions` | GET | admin | Plan + status breakdown |
| `/api/admin/payments` | GET | admin | Billing history + revenue |
| `/api/admin/memories` | GET | admin | Platform memory overview |
| `/api/admin/reports` · `/[id]` | GET/PATCH | admin | Moderation queue + status |
| `/api/admin/settings` | GET/PATCH | admin | Feature flags + coin economy |
| `/api/webhooks/stripe` | POST | signed | Stripe subscription + invoice events |
| `/api/reports` | POST | user | File a report |
| `/api/flags` | GET | user | Feature-flag map for the client |
| `/api/webhooks/clerk` | POST | signed | Clerk → Supabase user sync |

---

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — start built server
- `npm run lint` — ESLint

---

## Status & roadmap

### ✅ Done
- OpenRouter chat with **per‑character model + system prompt**
- Admin **Characters** CRUD with R2 image upload
- Admin **Users** (real list + detail, plan/coins actions, no chat access)
- Admin **Usage & cost** analytics + real dashboard
- **AI usage/cost logging** per reply
- **Cloudflare R2** storage integration
- **User‑created girls** (private) + **DB‑driven home page**
- **Chat privacy** enforced at the DB level
- Admin **Subscriptions / Payments / Memories** pages — real Supabase data
- Admin **Reports** — `reports` table + user "Report" button (in chat) + admin queue with
  status workflow (open → reviewing → resolved/dismissed)
- Admin **Settings** — feature flags + **coin economy** (signup/login bonus, per-message
  costs, free daily limit, monthly allowances) persisted in `app_settings`
- **Streaming chat replies** — tokens stream live to the browser (NDJSON stream from
  `/api/chat/[id]/messages`); usage/cost still logged at the end
- **Feature flags wired** — `user_created_characters`, `voice_calls_beta`, `image_generation`
  gate their UI/routes (read via `/api/flags` + `useFlag`, enforced server-side)
- **R2 storage‑usage card** on the admin dashboard (sums `media_assets.size_bytes`)
- **Home filter columns** — `characters.gender/style/age` are real DB columns, editable in
  both character forms and used by the home/explore filters
- **Ban / suspend users** — admin can ban (with reason) from the user detail page; banned
  users see a notice in `/dashboard` and are blocked from all mutating APIs
- **Stripe billing** — checkout, webhooks, monthly coin grants on `invoice.paid`
- **Production hardening** — Stripe dev bypass blocked in production; Upstash required for
  rate-limited routes; RLS on v2 analytics/push/tenant tables

### 🚧 Upcoming / still to build
- `new_signup_flow` flag is defined + toggleable but has no entry point wired yet.
- Per‑user model overrides
- Real image / voice generation (the generate + voice screens are UI/stubs)

---

## Working with this codebase (AI‑assisted)

This project is developed with an AI coding assistant using a **plan‑first** workflow:

1. Describe the feature or change you want.
2. The assistant explores the codebase and produces a written **plan** (scope, files to
   touch, DB migrations, reusable utilities, verification steps).
3. After you approve the plan, it implements phase by phase, typechecks, and runs the build.

When requesting new work, point at the relevant area (e.g. "make the admin Payments page
real") — the patterns above (`src/lib/data/*`, `/api/admin/*`, React Query client pages,
numbered `supabase/migrations/*`) are the conventions to follow. Keep this README's
**Status & roadmap** updated as items move from Upcoming → Done.

---

## Notes
- New DB columns/tables → add a numbered migration **and** update
  [`src/types/database.ts`](src/types/database.ts).
- Anything touching multiple users' data must use the service‑role client and re‑check admin
  with `isAdminRequest()`.
- Never expose chat message content to admins — it is blocked at the DB layer by design.
</content>
