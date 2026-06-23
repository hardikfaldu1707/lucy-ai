# 04 — Folder Structure

> Annotated map of the repository. Paths are relative to the repo root. The alias `@/` resolves to `src/`.

---

## 1. Repository Root

```
Lucy/
├── src/                      # All application code
├── supabase/
│   └── migrations/           # 22 SQL migrations (0001 … 0022) — the DB schema
├── public/                   # Static assets served as-is
├── scripts/                  # Ops scripts (test-r2.mjs — R2 connectivity test)
├── docs/                     # ← this documentation package
├── .github/workflows/ci.yml  # CI: npm ci → lint → build
├── next.config.ts            # Security headers (CSP/HSTS) + image remote patterns
├── eslint.config.mjs         # ESLint (next/core-web-vitals + typescript)
├── postcss.config.mjs        # Tailwind v4 PostCSS plugin
├── tsconfig.json             # TS strict; @/* → ./src/*
├── package.json              # deps + scripts (dev/build/start/lint)
└── .env.example              # Template of all required env vars
```

---

## 2. The `src/` Tree

```
src/
├── app/            # Next.js App Router — routes, layouts, API
├── components/     # React components, grouped by feature
├── features/       # Larger self-contained feature modules
├── hooks/          # Reusable React hooks
├── lib/            # Server/business logic, integrations, data access
├── providers/      # React context providers (Clerk, Theme, Query)
├── store/          # Zustand client stores
├── types/          # TypeScript types (incl. generated DB types)
├── constants/      # App config: plans, routes, models, flags
└── styles/         # globals.css (Tailwind v4 theme)
```

---

## 3. `src/app/` — Routing

Next.js App Router. **Parenthesized folders are route *groups*** — they organize files and share a layout but **do not** appear in the URL.

```
app/
├── layout.tsx              # Root layout: ClerkProvider → Theme → Query → Toaster
├── error.tsx               # Global error boundary
├── not-found.tsx           # 404 page
│
├── (marketing)/            # Public marketing site (no URL segment)
│   ├── pricing/  faq/  features/  contact/  privacy/  terms/
│
├── (landing)/              # Public product surfaces
│   ├── explore/  create/  generate/  chat/
│
├── (dashboard)/            # Authenticated user app  → /dashboard/*
│   ├── layout.tsx          # Dashboard shell (sidebar/nav)
│   └── dashboard/
│       ├── page.tsx               # Home
│       ├── chat/                  # Chat UI + [id] conversation view
│       ├── characters/            # Browse + [id] detail + new
│       ├── my-girls/              # User-created characters
│       ├── voice/                 # Voice call (beta)
│       └── subscription/          # Plan + billing
│
├── (admin)/                # Admin control panel  → /admin/*
│   ├── layout.tsx          # ADMIN GATE — blocks non-admins
│   └── admin/
│       ├── page.tsx               # Dashboard / KPIs
│       ├── users/ + users/[id]/   # User management & detail
│       ├── characters/            # Catalog management
│       ├── ai-models/             # Model allow-list + test
│       ├── settings/              # Feature flags + economy
│       ├── payments/              # Billing records
│       ├── usage/                 # AI usage + unit economics
│       ├── cohorts/               # Retention + funnel
│       ├── tenants/               # White-label tenants
│       └── reports/               # Content reports
│
├── sign-in/[[...sign-in]]/ # Clerk hosted sign-in (catch-all)
├── sign-up/[[...sign-up]]/ # Clerk hosted sign-up (catch-all)
│
└── api/                    # Route handlers — see §5
```

---

## 4. `src/lib/` — The Business-Logic Core

This is where most engineering effort lives. Organized by concern:

```
lib/
├── ai/                     # All AI integration
│   ├── openrouter.ts          # OpenRouter client + model-list cache (5 min)
│   ├── character-chat.ts      # buildSystemPrompt, streamCharacterReply
│   ├── image-gen.ts           # In-chat image generation
│   ├── memory-extract.ts      # Async memory extraction from exchanges
│   ├── relationship.ts        # Relationship status progression
│   ├── prompt-safety.ts       # SAFETY_RULES, sanitizeUserText, memory formatting
│   ├── validate-model.ts      # Model availability checks
│   └── security/              # AI security layer
│       ├── sanitize.ts            # Input sanitization
│       ├── injection.ts           # Prompt-injection detection
│       ├── moderation.ts          # Content moderation
│       └── output-guard.ts        # Output leak/moderation guard
│
├── auth/                   # Authorization gates
│   ├── admin-role.ts          # isAdminUser(userId, claims)
│   ├── require-admin.ts       # isAdminRequest()
│   └── require-not-banned.ts  # ensureNotBanned() / bannedResponse()
│
├── data/                   # 25+ Supabase query modules (the data layer)
│   ├── chat.ts                # conversations + messages
│   ├── memories.ts            # memory queries
│   ├── economy-settings.ts    # admin-configurable economy (overrides defaults)
│   ├── ai-model-settings.ts   # allowed models + default model
│   ├── ai-usage.ts            # usage logging
│   ├── admin-*.ts             # admin aggregates (stats, users, billing, cohorts…)
│   └── …
│
├── supabase/               # DB clients
│   ├── client.ts              # browser (anon, RLS)
│   ├── server.ts              # server (anon + Clerk JWT, RLS)
│   └── admin.ts               # service role (BYPASSES RLS)
│
├── coins/spend.ts          # spendCoinsForAction / refundCoinsForAction
├── billing/sync-subscription.ts  # single source of truth for sub state
├── storage/r2.ts           # Cloudflare R2 presigned uploads
├── voice/tts.ts            # OpenAI TTS synthesis
├── security/audit.ts       # security event logging, abuse auto-suspend
├── validation/             # zod schemas + parseBody helper
├── analytics/track.ts      # trackEvent → analytics_events
├── stripe.ts               # Stripe client + price↔plan mapping
├── plan-limits.ts          # PLAN_LIMITS, assertCanSendMessage/CreateCharacter
├── rate-limit.ts           # Upstash limiters (api/subscription/webhook)
├── coins-config.ts         # default coin economy constants
├── tenant.ts               # multi-tenant resolution
├── ensure-profile.ts       # lazily create profile on first authed call
└── utils.ts                # cn() and misc helpers
```

**Mental model:** A route handler should be *thin* — authenticate, validate, then call into `lib/`. The heavy lifting (queries in `lib/data`, AI in `lib/ai`, money in `lib/coins`) is reusable and server-only.

---

## 5. `src/app/api/` — Endpoints

Full reference in [06 — API](06-api-documentation.md). Grouping:

```
api/
├── me/                     # current-user info (isAdmin)
├── flags/                  # public feature flags
├── onboarding/complete/
├── characters/             # +/mine, /[id], /[id]/favorite
├── ai-models/              # user-visible model list
├── chat/                   # start, conversations, [id]/messages (SSE), [id]/image
├── memories/               # CRUD (+/[id])
├── notifications/
├── voice/tts/
├── upload/                 # R2 presigned URL
├── subscription/           # upgrade, cancel
├── push/subscribe/
├── reports/
├── admin/                  # ~20 admin endpoints
└── webhooks/
    ├── clerk/              # user.created/updated/deleted
    └── stripe/             # checkout/subscription/invoice events
```

---

## 6. Supporting Folders

| Folder | Contents |
|---|---|
| `src/components/` | Feature-grouped UI: `chat/`, `character/`, `admin/`, `subscription/`, `voice/`, `coins/`, `onboarding/`, `layout/`, `shared/`, and `ui/` (Radix/shadcn primitives). |
| `src/features/memory/` | The Memory Center module (`memory-center.tsx`). |
| `src/hooks/` | `use-ai-models`, `use-flags`, `use-is-admin`, `use-debounce`. |
| `src/providers/` | `app-providers.tsx`, `query-provider.tsx`, `theme-provider.tsx`. |
| `src/store/` | `chat-store.ts`, `ui-store.ts` (Zustand). |
| `src/types/` | `index.ts` (app types) + `database.ts` (generated from Supabase, large). |
| `src/constants/` | `plans.ts`, `routes.ts`, `ai-models.ts`, `feature-flags.ts`, `home-characters.ts`, etc. |
| `src/styles/globals.css` | Tailwind v4 import + `@theme` color tokens (OkLCh). |

---

## 7. Naming & Layout Conventions

- **Route groups** `(name)/` segment routes without affecting URLs; each can own a `layout.tsx`.
- **Client components** that pair with a server page are often suffixed `-client.tsx` (e.g. `users-client.tsx`), keeping the page a server component and pushing interactivity into the client child.
- **Dynamic segments** use `[id]`; **catch-alls** use `[[...x]]` (Clerk auth pages).
- **`server-only`** is imported at the top of any module that must never reach the browser (all of `lib/ai`, `lib/supabase/admin`, etc.).
- **Data access is centralized** in `lib/data/*` — route handlers and components should call these rather than querying Supabase inline.
