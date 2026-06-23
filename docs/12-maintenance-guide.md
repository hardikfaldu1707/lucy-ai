# 12 — Maintenance Guide

> Routine operations to keep Lucy healthy: dependency upkeep, migrations, monitoring, recurring tasks, and the standing technical-debt items.

---

## 1. Routine Operational Tasks

| Cadence | Task |
|---|---|
| **Daily** | Scan error/security logs; check coin-drift (`coin_balance_check` view) is 0; watch AI spend in `/admin/usage`. |
| **Weekly** | Review `/admin/reports` queue; review banned/auto-suspended accounts; check rate-limit 429/503 rates. |
| **Monthly** | `npm audit` + dependency review; reconcile Stripe revenue vs `billing_records`; review cohort retention. |
| **Quarterly** | Backup/restore drill; secret rotation review; CSP/security checklist re-run; dependency major upgrades. |

---

## 2. Dependency Updates

```bash
# inspect outdated packages
npm outdated

# patch/minor (safe)
npm update

# audit
npm audit
npm audit fix          # review before applying

# majors — one at a time, then build + manual smoke test
npm install next@latest eslint-config-next@latest   # keep in lockstep
```

**Rules of thumb:**
- **Next.js + `eslint-config-next`** must move together (same major).
- **React 19 / Tailwind 4** are leading-edge — read migration notes before bumping majors.
- After any update: `npm run build` must pass; manually smoke-test login, chat, and checkout (no test suite to catch regressions — see §6).

---

## 3. Database Maintenance

| Task | How |
|---|---|
| Apply schema change | New migration → `supabase db push` → regenerate types ([11 §8](11-deployment-guide.md)) |
| Verify coin integrity | `select * from coin_balance_check where drift <> 0;` (should return nothing) |
| Index health / slow queries | Supabase dashboard → Query Performance |
| Orphan/abuse cleanup | Banned users; old incognito conversations (if a retention policy is defined) |
| Type drift | Regenerate `src/types/database.ts` after every migration |

> **Never** mutate `coin_balances` directly — always via `spend_coins`/`grant_coins` to preserve the ledger.

---

## 4. Configuration Maintenance (no deploy needed)

These live in the DB (`app_settings`) and are edited in `/admin/settings`:
- **Feature flags:** `user_created_characters`, `image_generation`, `voice_calls_beta`.
- **Economy:** signup bonus, per-plan allowances, action costs.

And in `/admin/ai-models`:
- **Allowed models + default model** — the lever for cost/quality. Test before enabling.

Changing these is the preferred way to adjust behavior without a code release.

---

## 5. Monitoring & Logs

| Signal | Where (current) | Recommended addition |
|---|---|---|
| Application errors | host (Vercel) function logs + `console.error` | **Sentry** or equivalent |
| Security events | `logSecurityEvent` (audit) | alerting on spikes |
| Product analytics | `analytics_events` + admin cohorts | — |
| AI cost | `/admin/usage`, `/admin/unit-economics` | budget alert |
| DB health | Supabase dashboard | uptime/latency alerts |
| Rate limiting | Upstash dashboard | 429/503 alert |
| Payments | Stripe dashboard + `/admin/payments` | webhook-failure alert |

> **Top gap:** there is no error-tracking/alerting integration in-repo. Add one before scaling — see [PROJECT_INDEX §7](PROJECT_INDEX.md).

---

## 6. Standing Technical Debt

| Item | Impact | Recommended action |
|---|---|---|
| **No automated tests** | High regression risk | Add Vitest (unit for `lib/`), API integration tests, Playwright e2e for chat/checkout |
| **No error tracking** | Blind to prod failures | Integrate Sentry |
| **Image generation placeholder** | Feature incomplete | Wire a real image model or flag off |
| **CSP `unsafe-inline/eval` + placeholder CDNs** | XSS surface | Tighten ([10 §9](10-security-documentation.md)) |
| **No AI failover** | Outage = downtime | Add model/provider cascade |
| **No staging in-repo** | Risky releases | Use preview deploys + test projects |
| **Scaffolded features** (push send, voice calls, coin purchase) | Half-built paths | Finish or flag off |

---

## 7. Code Maintenance Conventions

- Keep route handlers thin; put logic in `lib/` (queries in `lib/data`, AI in `lib/ai`, money in `lib/coins`).
- New user-write route → include `bannedResponse()` + rate limit + Zod validation.
- New admin route → include `isAdminRequest()`.
- Never import `lib/supabase/admin` (service role) into client-reachable code.
- Run `npm run lint` before every PR; CI enforces lint + build.

---

## 8. Onboarding a New Developer (fast path)

1. Read [04 — Folder Structure](04-folder-structure.md) and [02 — Architecture](02-system-architecture.md).
2. Set up local env ([11 §2](11-deployment-guide.md)).
3. Trace the chat path: [src/app/api/chat/[id]/messages/route.ts](../src/app/api/chat/%5Bid%5D/messages/route.ts) → `lib/ai/character-chat.ts` → `lib/coins/spend.ts`.
4. Read [05 — Database](05-database-documentation.md) for the data model + RLS.
5. Make a small change behind a feature flag; verify on a preview deploy.
