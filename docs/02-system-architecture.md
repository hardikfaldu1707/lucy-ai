# 02 — System Architecture

> Diagrams use [Mermaid](https://mermaid.js.org/). They render in GitHub, GitLab, VS Code (with a Mermaid extension), and most modern markdown viewers.

---

## 1. Overall Architecture

Lucy is a **single Next.js application** that orchestrates a set of managed third-party services. The Next.js server (route handlers + server components) is the only first-party compute; everything else is SaaS.

```mermaid
flowchart TB
  subgraph Client["🌐 Browser"]
    UI["Next.js React 19 UI<br/>(App Router, Tailwind, Radix)"]
  end

  subgraph Vercel["☁️ Next.js App (Vercel-class serverless)"]
    RSC["Server Components<br/>+ Server Actions"]
    API["API Route Handlers<br/>/src/app/api/*"]
  end

  subgraph Managed["🔌 Managed Services"]
    Clerk["Clerk<br/>Auth & Identity"]
    Supabase["Supabase<br/>Postgres + RLS + Realtime"]
    OpenRouter["OpenRouter<br/>LLM Router"]
    Stripe["Stripe<br/>Billing"]
    R2["Cloudflare R2<br/>Object Storage"]
    Upstash["Upstash Redis<br/>Rate Limiting"]
    OpenAI["OpenAI<br/>TTS (optional)"]
  end

  UI -->|HTTPS| RSC
  UI -->|fetch / SSE| API
  UI -.->|hosted auth widgets| Clerk

  RSC --> Supabase
  API --> Supabase
  API --> OpenRouter
  API --> Stripe
  API --> R2
  API --> Upstash
  API --> OpenAI

  Clerk -->|webhook user.*| API
  Stripe -->|webhook checkout/invoice| API
```

**Key principle:** the app server holds the *secrets* and *business logic*; the browser only ever talks to first-party endpoints and Clerk's hosted widgets. The Supabase service-role key, OpenRouter key, Stripe secret, and R2 keys never reach the client.

---

## 2. Frontend Architecture

```mermaid
flowchart TB
  Root["app/layout.tsx<br/>(root layout)"] --> Providers
  subgraph Providers["Provider stack"]
    direction TB
    P1["ClerkProvider"] --> P2["ThemeProvider (next-themes)"]
    P2 --> P3["QueryProvider (TanStack Query)"]
    P3 --> P4["Sonner Toaster"]
  end

  Providers --> Groups
  subgraph Groups["Route Groups (app/)"]
    M["(marketing)<br/>pricing, faq, terms…"]
    L["(landing)<br/>explore, create, generate"]
    D["(dashboard)<br/>chat, characters, voice, subscription"]
    A["(admin)<br/>users, characters, economy, analytics"]
    Auth["sign-in / sign-up"]
  end

  Groups --> State
  subgraph State["Client State"]
    Q["TanStack Query<br/>(server cache)"]
    Z["Zustand<br/>(chat-store, ui-store)"]
  end

  subgraph UI["Component layers"]
    Shad["components/ui/<br/>(Radix + shadcn primitives)"]
    Feat["components/{chat,character,admin,…}"]
  end
  Groups --> UI
```

- **Server state** (data from APIs) → TanStack Query. **Ephemeral UI state** (open panels, current chat draft) → Zustand stores in `src/store/`.
- **Forms** use `react-hook-form` + `zod` resolvers.
- **Styling** is Tailwind v4 with a custom OkLCh theme defined inline in `src/styles/globals.css`; primitives in `components/ui/` follow the shadcn pattern over Radix.

---

## 3. Backend Architecture

The backend is **route handlers + server-only library code**. There is a deliberate layering:

```mermaid
flowchart TB
  Route["API Route Handler<br/>(thin: auth, validate, orchestrate)"]
  Route --> Gate["lib/auth/*<br/>requireAdmin / ensureNotBanned"]
  Route --> RL["lib/rate-limit.ts<br/>Upstash sliding window"]
  Route --> Val["lib/validation/*<br/>zod schemas + parseBody"]
  Route --> AI["lib/ai/*<br/>character-chat, memory, security"]
  Route --> Coins["lib/coins/spend.ts<br/>→ spend_coins RPC"]
  Route --> Data["lib/data/*<br/>(25+ query modules)"]
  Data --> SB["lib/supabase/{server,admin,client}.ts"]
  AI --> OR["OpenRouter"]
  Coins --> SBA["Supabase RPC"]
  SB --> PG[(Postgres)]
```

**Three Supabase clients** (`src/lib/supabase/`):
| Client | Key | RLS | Used by |
|---|---|---|---|
| `client.ts` | anon | enforced | browser |
| `server.ts` | anon (+ Clerk JWT) | enforced | server components / user-scoped reads |
| `admin.ts` | service role | **bypassed** | webhooks, admin ops, coin grants |

> **Security note:** the service-role client bypasses RLS entirely. Its use is intentionally confined to webhooks, admin routes, and privileged RPC calls. Any new use should be reviewed.

---

## 4. Database Architecture

Supabase Postgres with **Row-Level Security on every user-owned table**. Ownership is the Clerk user id (`auth.jwt()->>'sub'`). See [05 — Database](05-database-documentation.md) for the full ER diagram and per-table detail.

```mermaid
flowchart LR
  subgraph Identity
    profiles
    subscriptions
    user_settings
  end
  subgraph Economy
    coin_balances
    coin_ledger
    action_costs
    billing_records
  end
  subgraph Content
    characters
    user_characters
    conversations
    messages
    memories
    media_assets
  end
  subgraph Platform
    tenants
    app_settings
    analytics_events
    notifications
    push_subscriptions
    reports
  end

  profiles --> subscriptions
  profiles --> coin_balances
  profiles --> conversations
  conversations --> messages
  profiles --> memories
  characters --> conversations
  profiles --> user_characters
  characters --> user_characters
  tenants --> profiles
  tenants --> characters
```

**Integrity mechanisms:** atomic coin RPCs (`spend_coins`/`grant_coins`), idempotency keys on the ledger, a `coin_balance_check` reconciliation view, and FK `ON DELETE CASCADE` so deleting a profile removes all owned data.

---

## 5. Authentication Flow

```mermaid
sequenceDiagram
  participant U as User
  participant C as Clerk (hosted)
  participant App as Next.js App
  participant WH as /api/webhooks/clerk
  participant DB as Supabase

  U->>C: Sign up / Sign in
  C-->>U: Session token (JWT)
  C->>WH: webhook user.created (Svix-signed)
  WH->>WH: verifyWebhook(secret)
  WH->>DB: upsert profile + subscription + settings (service role)
  WH->>DB: grant_coins(signup_bonus, idempotency=signup:userId)
  U->>App: Authenticated request (JWT)
  App->>App: auth() → userId, sessionClaims
  App->>DB: query with JWT → RLS scopes to userId
  DB-->>App: only this user's rows
```

Full detail, including session management and RBAC, in [07 — Authentication Flow](07-authentication-flow.md).

---

## 6. AI Request Flow (Chat)

This is the critical path: `POST /api/chat/[id]/messages` (see [src/app/api/chat/[id]/messages/route.ts](../src/app/api/chat/%5Bid%5D/messages/route.ts)).

```mermaid
sequenceDiagram
  participant U as User
  participant API as Chat API
  participant G as Security Guards
  participant Coin as spend_coins RPC
  participant LLM as OpenRouter
  participant DB as Supabase

  U->>API: POST message {content}
  API->>API: auth → rate limit → ensureProfile → ban check
  API->>API: assertCanSendMessage (daily limit)
  API->>G: guardChatInput (moderation + injection)
  alt blocked
    G-->>API: 422; log security event; maybe auto-suspend
    API-->>U: error (no coin spent)
  else allowed
    API->>DB: insert user message
    API->>Coin: spend 1 coin (idempotency=chat:user:msgId)
    API->>DB: load history + memories + summary
    API->>LLM: stream completion (system prompt + history)
    loop streaming
      LLM-->>API: delta
      API-->>U: {type:delta} (NDJSON)
    end
    API->>G: guardOutput (leak + moderation)
    alt unsafe
      G-->>API: replace text with safe fallback
    end
    API->>DB: insert assistant msg, update preview, relationship
    API->>DB: log usage; trackEvent; extract memories (async)
    API-->>U: {type:done}
    note over API,Coin: On any failure → refund coin + delete msg
  end
```

Full detail in [08 — AI System](08-ai-system-documentation.md).

---

## 7. Payment Flow

```mermaid
sequenceDiagram
  participant U as User
  participant API as /api/subscription/upgrade
  participant S as Stripe
  participant WH as /api/webhooks/stripe
  participant DB as Supabase

  U->>API: POST {plan: premium|ultimate}
  API->>API: auth → rate limit (subscription)
  alt dev bypass
    API->>DB: syncSubscription directly (no payment)
  else real
    API->>S: create Checkout Session (metadata: profile_id, plan)
    S-->>U: redirect to hosted checkout
    U->>S: pays
    S->>WH: checkout.session.completed (signed)
    WH->>DB: syncSubscription(active, period_end, stripe ids)
    S->>WH: invoice.paid (signed)
    WH->>DB: insert billing_record (idempotent on invoice id)
    WH->>DB: grant_coins(monthly allowance, idempotency=sub_grant:invoiceId)
  end
  Note over S,WH: subscription.updated / deleted → re-sync or downgrade
```

---

## 8. Deployment Architecture

```mermaid
flowchart TB
  Dev["Developer"] -->|git push| GH["GitHub repo"]
  GH -->|push/PR| CI["GitHub Actions CI<br/>npm ci → lint → build"]
  GH -->|main| Host["Vercel-class Host<br/>(serverless functions + edge CDN)"]

  subgraph Host
    Edge["Edge / CDN<br/>static assets"]
    Fn["Serverless Functions<br/>route handlers"]
  end

  Host --> Clerk
  Host --> Supabase[(Supabase<br/>managed Postgres)]
  Host --> OpenRouter
  Host --> Stripe
  Host --> R2[(Cloudflare R2)]
  Host --> Upstash[(Upstash Redis)]

  Clerk -.webhook.-> Fn
  Stripe -.webhook.-> Fn
```

> **⚠️ Assumption:** No `Dockerfile`, `vercel.json`, or other host manifest is committed. Given Next.js 16 + serverless route handlers + the absence of any container/orchestration config, **Vercel** (or an equivalent Next.js-native serverless platform) is the assumed target. The CI workflow (`.github/workflows/ci.yml`) only lints and builds — it does **not** deploy — so deployment is presumed handled by the host's Git integration. See [11 — Deployment Guide](11-deployment-guide.md).
