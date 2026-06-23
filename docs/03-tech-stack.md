# 03 — Technology Stack

> Versions are taken verbatim from [package.json](../package.json). The `^` prefix means "compatible with" — the installed version may be a higher patch/minor.

---

## 1. At a Glance

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5.8 |
| **UI runtime** | React 19 |
| **Styling** | Tailwind CSS v4 |
| **Component primitives** | Radix UI (shadcn pattern) |
| **Auth** | Clerk |
| **Database** | Supabase (PostgreSQL) |
| **LLM** | OpenRouter |
| **Payments** | Stripe |
| **Object storage** | Cloudflare R2 (AWS S3 SDK) |
| **Rate limiting** | Upstash Redis |
| **Voice (TTS)** | OpenAI |
| **Server state** | TanStack Query |
| **Client state** | Zustand |
| **Validation** | Zod |
| **Forms** | react-hook-form |

---

## 2. Core Framework & Language

| Package | Version | Role |
|---|---|---|
| `next` | ^16.2.7 | Full-stack React framework. App Router, server components, route handlers, image optimization, security headers. Dev uses **Turbopack** (`next dev --turbopack`). |
| `react` / `react-dom` | ^19.1.0 | UI runtime (React 19 — supports the new async/transition features the App Router uses). |
| `typescript` | ^5.8.3 | Strict-mode typing across the whole codebase. Path alias `@/*` → `./src/*`. Target `ES2017`, module resolution `bundler`. |

**Why this stack:** Next.js lets the team ship server logic (API routes), server-rendered pages, and the client UI from one repo and one deploy. It is the natural fit for a serverless host.

---

## 3. Authentication

| Package | Version | Role |
|---|---|---|
| `@clerk/nextjs` | ^7.4.3 | Drop-in auth: hosted sign-in/up, session management, `auth()` server helper, webhook verification (`verifyWebhook`). |
| `@clerk/ui` | ^1.15.0 | Pre-built Clerk UI components. |

Clerk is the identity source of truth; Supabase trusts Clerk's JWT (`sub` claim) for RLS. See [07 — Auth](07-authentication-flow.md).

---

## 4. Data & Backend Services

| Package | Version | Role |
|---|---|---|
| `@supabase/supabase-js` | ^2.107.0 | Postgres client (queries, RPC, Realtime). Three client instances: anon (browser), server, service-role (admin). |
| `stripe` | ^22.2.0 | Server-side Stripe SDK: Checkout sessions, subscription retrieval, webhook signature verification. |
| `@aws-sdk/client-s3` | ^3.1063.0 | S3-compatible client pointed at Cloudflare R2. |
| `@aws-sdk/s3-request-presigner` | ^3.1063.0 | Generates presigned PUT URLs for direct browser → R2 uploads. |
| `@upstash/redis` | ^1.38.0 | Serverless Redis REST client. |
| `@upstash/ratelimit` | ^2.0.8 | Sliding-window rate limiting on top of Upstash Redis. |

---

## 5. State, Data Fetching & Validation

| Package | Version | Role |
|---|---|---|
| `@tanstack/react-query` | ^5.80.7 | Server-state cache: fetching, caching, invalidation of API data. |
| `zustand` | ^5.0.5 | Lightweight client store (`chat-store.ts`, `ui-store.ts`). |
| `react-hook-form` | ^7.57.0 | Performant form state management. |
| `@hookform/resolvers` | ^5.0.1 | Bridges Zod schemas into react-hook-form. |
| `zod` | ^3.25.51 | Runtime schema validation for API request bodies and forms (`lib/validation/schemas.ts`). |

---

## 6. UI & Styling

| Package | Version | Role |
|---|---|---|
| `tailwindcss` | ^4.1.8 | Utility-first CSS (v4 — config via `@theme` in `globals.css`, not a JS config file). |
| `@tailwindcss/postcss` | ^4.1.8 | Tailwind v4 PostCSS integration. |
| Radix UI (`@radix-ui/react-*`) | various | Headless, accessible primitives (dialog, dropdown, select, accordion, etc.) — the base for `components/ui/`. |
| `lucide-react` | ^0.513.0 | Icon set. |
| `framer-motion` | ^12.16.0 | Animations and transitions. |
| `tailwind-merge` | ^3.3.0 | Dedupes/merges conflicting Tailwind classes. |
| `clsx` | ^2.1.1 | Conditional class composition. |
| `sonner` | ^2.0.5 | Toast notifications. |
| `next-themes` | ^0.4.6 | Dark/light theme switching. |

---

## 7. Server Hardening

| Package | Version | Role |
|---|---|---|
| `server-only` | ^0.0.1 | Compile-time guard — importing a `server-only` module from client code is a build error. Used to keep secrets (OpenRouter key, service role) out of the browser bundle. |

---

## 8. Dev & Tooling

| Package | Version | Role |
|---|---|---|
| `eslint` | ^9.28.0 | Linting. |
| `eslint-config-next` | ^16.2.7 | Next.js + core-web-vitals + TypeScript lint rules. |
| `@types/*` | various | Type definitions for React, Node. |
| `dotenv` | ^17.4.2 | Loads `.env` for scripts. |

**Scripts** (`package.json`):
```jsonc
"dev":   "next dev --turbopack",  // local dev (Turbopack)
"build": "next build",            // production build
"start": "next start",            // run production build
"lint":  "eslint ."               // lint
```

---

## 9. Database Tooling (not an npm dependency)

The database is managed via **Supabase CLI migrations** — 22 raw SQL files in [supabase/migrations/](../supabase/migrations/) (`0001` … `0022`). TypeScript types are generated from the live schema into [src/types/database.ts](../src/types/database.ts).

> **⚠️ Assumption:** Supabase CLI is the migration tool (migrations are hand-written SQL with Supabase-specific helpers like `auth.jwt()`). The CLI is a developer prerequisite, not a runtime dependency.

---

## 10. Version & Upgrade Notes

- **Next 16 + React 19 + Tailwind 4** are all recent-major versions — keep them in lockstep; a Next major bump often requires matching `eslint-config-next`.
- **No lockfile-pinned exact versions in these docs** — consult `package-lock.json` for the resolved tree before any upgrade.
- **No test framework is installed.** Adding Vitest/Jest + Playwright is the top maintenance recommendation ([12 — Maintenance](12-maintenance-guide.md)).

### Common mistakes to avoid
- Importing `lib/supabase/admin.ts` (service role) into anything that could reach the client — always guard server-only modules.
- Editing Tailwind config expecting a `tailwind.config.js` — v4 uses the `@theme` block in `globals.css`.
- Bumping `next` without bumping `eslint-config-next` to the same major.
