# 13 — Scaling Guide

> How to scale Lucy from launch to one million users. The architecture (serverless app + managed Postgres + model router) scales well to mid-six-figures with little change; beyond that, caching, queues, and data partitioning become necessary.
>
> Figures are **planning estimates** (⚠️) — validate against real metrics before provisioning.

---

## 1. Scaling Philosophy

Three resources dominate cost and load, in order:
1. **AI inference** (OpenRouter spend + latency) — the biggest cost and the core SPOF.
2. **Database** (Supabase Postgres connections, write throughput, table size).
3. **App compute** (serverless functions — mostly auto-scaling).

The app tier is largely elastic; **the database and AI tier are where you engineer.**

---

## 2. Scaling Tiers

### 2.1 — 1,000 users
**Status: works out-of-the-box.**

| Area | Action |
|---|---|
| App | Default serverless; no change |
| DB | Supabase free/small tier; existing indexes sufficient |
| AI | Default models; coin gating caps spend |
| Caching | None needed |
| Infra | Single region |

Focus: instrument everything (error tracking, AI cost, retention) so the next tiers are data-driven.

### 2.2 — 10,000 users
**Status: minor tuning.**

| Area | Action |
|---|---|
| DB | Move to a paid Supabase tier; **enable connection pooling (PgBouncer/Supavisor)** — serverless opens many short connections |
| AI | Confirm OpenRouter rate limits; consider a paid model tier for quality |
| Caching | Cache the **character catalog** and **model list** (already 5-min cached) at the edge |
| Rate limits | Tune `apiLimiter` thresholds; ensure Upstash sized appropriately |
| Monitoring | Add alerts on error rate, webhook failures, coin drift |

### 2.3 — 50,000 users
**Status: introduce async + caching.**

| Area | Action |
|---|---|
| DB | Add **read replicas** for analytics/admin queries; review/extend indexes; archive old `messages`/`analytics_events` |
| AI | **Provider/model fallback cascade**; per-user **cost circuit breaker** |
| Async | Move **memory extraction** and **analytics** off the request path into a **queue** (e.g. Upstash QStash / a worker) |
| Caching | Edge-cache public marketing + catalog; cache per-user dashboard aggregates |
| Media | Serve R2 via CDN/custom domain; enforce upload limits |
| CDN | Static assets + images via the host edge / Cloudflare |

### 2.4 — 100,000 users
**Status: partition hot paths.**

| Area | Action |
|---|---|
| DB | **Partition `messages`** (by month or `profile_id` hash); table-level archival; dedicated analytics warehouse (export `analytics_events`) |
| AI | Negotiate committed OpenRouter throughput; consider self-hosted/cheaper models for free tier; semantic-cache common replies (⚠️ careful with companion uniqueness) |
| Queues | All non-critical work async (memory, summaries, push, usage logging) |
| Realtime | Audit Supabase Realtime channel counts; shard if needed |
| Region | Consider multi-region read or moving DB closer to users |

### 2.5 — 1,000,000 users
**Status: platform engineering.**

| Area | Action |
|---|---|
| DB | Horizontal strategy: sharding by tenant/user, or a managed distributed Postgres; aggressive archival/cold-storage of old conversations |
| AI | Multi-provider routing with cost/latency-aware scheduling; dedicated inference contracts; tiered model assignment by plan |
| Caching | Multi-layer (edge + Redis); precomputed dashboards; CDN everywhere |
| Queues | Durable, retried, dead-lettered job system for all side effects |
| Observability | Full APM, tracing, SLOs, on-call |
| Cost controls | Real-time per-user/per-tenant budget enforcement |
| Org | Dedicated infra/ML-ops ownership |

---

## 3. Per-Concern Scaling

### Database
```mermaid
flowchart LR
  A[Single DB] --> B[+ Connection pooling]
  B --> C[+ Read replicas]
  C --> D[+ Partition messages / archive]
  D --> E[+ Shard / distributed PG]
```
- **Earliest win:** connection pooling — serverless functions exhaust raw connections fast.
- **Biggest table:** `messages` — partition and archive first.
- Keep RLS policies index-friendly; ensure `profile_id`/`conversation_id` filters hit indexes (they do today).

### AI
- **Latency:** streaming already hides perceived latency; keep `max_tokens` bounded.
- **Cost:** coin gating + token caps + per-user circuit breaker.
- **Reliability:** add the **fallback cascade** (the one true SPOF gap today).
- **Tiering:** cheaper/free models for Free plan, premium models for paid plans (the allow-list mechanism already supports this).

### Caching
| Layer | Cache |
|---|---|
| Edge/CDN | marketing pages, public catalog, static assets, media |
| App memory | OpenRouter model list (already 5 min) |
| Redis (Upstash) | feature flags, economy config, per-user aggregates |

### Queues
Move off the request path: memory extraction, conversation summarization, usage logging, analytics, push sends. Use Upstash QStash or a dedicated worker. This both **reduces latency** and **isolates failures**.

### CDN
Static assets via the host edge; **R2 media via a CDN/custom domain** (already supported through `R2_PUBLIC_URL`). Tighten `next.config.ts` image patterns to your own CDN.

---

## 4. Infrastructure Recommendations by Tier

| Users | App | DB | Redis | AI | Async |
|---|---|---|---|---|---|
| 1k | serverless default | small Supabase | optional | default | inline |
| 10k | serverless | paid + pooling | Upstash | confirm limits | inline |
| 50k | serverless | + replicas | Upstash (sized) | fallback + breaker | **queue** |
| 100k | serverless (multi-region read) | + partition/archive | clustered | committed throughput | queue (durable) |
| 1M | serverless + edge | sharded/distributed | multi-layer | multi-provider scheduler | full job system |

---

## 5. Performance Notes & Common Mistakes

- **Don't** let memory extraction or summarization block replies — already async; keep it that way and move to a queue at scale.
- **Watch connection counts** — the #1 surprise when serverless meets Postgres.
- **Cap AI spend per user** before a viral spike turns into a five-figure bill.
- **Archive `messages`** proactively; it grows fastest and dominates DB size.
- **Validate Realtime usage** — open channels are a hidden scaling cost.
