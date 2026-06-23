# 17 — Environment Variables

> Every environment variable Lucy uses, derived from `.env.example` and the code that reads them. **`NEXT_PUBLIC_*` variables are exposed to the browser** — never put secrets there.
>
> **Sensitivity legend:** 🔴 secret (server-only, high blast radius) · 🟠 secret · 🟢 public.

---

## 1. Authentication — Clerk

| Variable | Req | Sens | Purpose | Where to get it |
|---|---|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | 🟢 | Client-side Clerk init | Clerk dashboard → API keys |
| `CLERK_SECRET_KEY` | ✅ | 🔴 | Server-side Clerk (`auth()`, backend) | Clerk dashboard → API keys |
| `CLERK_WEBHOOK_SIGNING_SECRET` | ✅ | 🟠 | Verify `/api/webhooks/clerk` (Svix) | Clerk dashboard → Webhooks |

---

## 2. Database — Supabase

| Variable | Req | Sens | Purpose | Where to get it |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | 🟢 | Project URL | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | 🟢 | Anon key (RLS-enforced client) | Supabase → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | 🔴 | **God-mode** key — bypasses RLS; used by webhooks/admin/RPCs | Supabase → API |

> ⚠️ The service-role key is the single most dangerous secret. Keep it server-only (`server-only` import guard) and rotate first on any suspected leak.

---

## 3. AI — OpenRouter

| Variable | Req | Sens | Purpose | Default |
|---|---|---|---|---|
| `OPENROUTER_API_KEY` | ✅ | 🔴 | Chat completions | — |
| `OPENROUTER_MODEL` | ⬜ | 🟢 | Fallback model | `moonshotai/kimi-k2.6:free` |
| `OPENROUTER_IMAGE_MODEL` | ⬜ | 🟢 | Image generation model | (placeholder) |

---

## 4. Payments — Stripe

| Variable | Req | Sens | Purpose |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | ✅* | 🔴 | Stripe API (checkout, subscriptions) |
| `STRIPE_WEBHOOK_SECRET` | ✅* | 🟠 | Verify `/api/webhooks/stripe` |
| `STRIPE_PRICE_PREMIUM` | ✅* | 🟢 | Price id → Premium plan mapping |
| `STRIPE_PRICE_ULTIMATE` | ✅* | 🟢 | Price id → Ultimate plan mapping |

\* Required in production. In dev, `BILLING_DEV_BYPASS` lets upgrades work without Stripe.

---

## 5. Storage — Cloudflare R2

| Variable | Req | Sens | Purpose |
|---|---|---|---|
| `R2_ACCOUNT_ID` | ✅ | 🟠 | R2 endpoint (`<id>.r2.cloudflarestorage.com`) |
| `R2_ACCESS_KEY_ID` | ✅ | 🔴 | S3 access key |
| `R2_SECRET_ACCESS_KEY` | ✅ | 🔴 | S3 secret |
| `R2_BUCKET` | ✅ | 🟢 | Bucket name |
| `R2_PUBLIC_URL` | ✅ | 🟢 | Public base URL / custom domain for media |

---

## 6. Rate Limiting — Upstash Redis

| Variable | Req | Sens | Purpose |
|---|---|---|---|
| `UPSTASH_REDIS_REST_URL` | ✅ (prod) | 🟠 | Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ (prod) | 🔴 | Redis auth token |

> If unset in **production**, rate-limited routes return **503** (`rateLimitUnavailableResponse`). Optional in dev (limiters no-op).

---

## 7. Voice — OpenAI (optional)

| Variable | Req | Sens | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | ⬜ | 🔴 | TTS (`tts-1`, voice `nova`). If absent, TTS returns null / feature off. |

---

## 8. Web Push (optional)

| Variable | Req | Sens | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ⬜ | 🟢 | Public VAPID key for push subscription |

> ⚠️ A **VAPID private key** would be required to *send* pushes. Sending isn't implemented yet; if added, store the private key as a 🔴 secret (server-only).

---

## 9. App Configuration

| Variable | Req | Sens | Purpose | Default |
|---|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | ✅ | 🟢 | Canonical URL; sent as OpenRouter `HTTP-Referer`; Stripe redirect base | `http://localhost:3000` |
| `TENANT_SLUG` | ⬜ | 🟢 | Default white-label tenant | `lucy` |
| `BILLING_DEV_BYPASS` | ⬜ | 🟢 | Skip Stripe, allow direct plan upgrades | non-prod = on |
| `NODE_ENV` | (auto) | 🟢 | `development` / `production` — gates prod-only guards | — |

> ⚠️ **`BILLING_DEV_BYPASS` must be `false`/unset in production** — otherwise users upgrade without paying.

---

## 10. Deprecated / Remove

| Variable | Note |
|---|---|
| `OPENAI_MODEL` | Superseded by OpenRouter for chat; only `OPENAI_API_KEY` remains relevant (TTS). |

---

## 11. Minimal Local `.env.local`

To run chat locally (no payments/storage):
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
SUPABASE_SERVICE_ROLE_KEY=ey...
OPENROUTER_API_KEY=sk-or-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
# BILLING_DEV_BYPASS defaults on in dev; Upstash optional in dev
```

---

## 12. Handling Best Practices

- Store production secrets in the **host's secret manager** (Vercel env), scoped to the production environment.
- Never commit `.env.local`; keep `.env.example` as the documented template (values blank).
- Rotate 🔴 secrets on any suspicion; service-role and Stripe keys first ([16 §5](16-business-continuity-guide.md)).
- Treat `NEXT_PUBLIC_*` as **published to the world** — only non-sensitive values.
