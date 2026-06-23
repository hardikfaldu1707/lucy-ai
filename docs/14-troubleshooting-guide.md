# 14 — Troubleshooting Guide

> Symptom → likely cause → fix, for the most common operational failures. Organized by subsystem.

---

## 1. Authentication & Users

| Symptom | Likely cause | Fix |
|---|---|---|
| User signed up but has no profile / coins | Clerk `user.created` webhook failed or not configured | Check Clerk webhook logs + `CLERK_WEBHOOK_SIGNING_SECRET`; `ensureProfile()` should self-heal on next request; re-send the webhook event |
| All API calls return `401` | Missing/expired Clerk session, or JWT template misconfigured | Verify Clerk keys; confirm the session token exposes `sub` and `metadata.role` |
| Admin can't access `/admin` | `metadata.role` not in JWT and `is_admin` false | Set `public_metadata.role = 'admin'` in Clerk; wait for `user.updated` to sync `is_admin`; re-login to refresh JWT |
| Admin access lost after edit | Edited DB `is_admin` but not Clerk metadata; JWT fast-path still false | Always set role in Clerk, not just DB |
| Banned user can still act | New write route missing `bannedResponse()` | Add the ban gate to the route |
| Webhook returns 401/redirect | Webhook route caught by Clerk auth middleware | Exclude `/api/webhooks/*` from auth middleware |

---

## 2. Chat & AI

| Symptom | Likely cause | Fix |
|---|---|---|
| Chat replies error immediately | `OPENROUTER_API_KEY` missing/invalid | Set/rotate the key; check OpenRouter dashboard |
| `"OpenRouter API error (4xx/5xx)"` | Model unavailable, rate-limited, or out of credit | Check the model is in the allow-list and live; test via `/api/admin/ai-models/test`; add credit |
| Reply starts then fails; coin not lost | Generation error after spend | **By design** — coin is refunded and user message deleted; just retry |
| Reply blocked with 422 | Input hit moderation/injection guard | Expected for abusive/injection content; repeated hits auto-suspend the user |
| Assistant text replaced mid-stream | Output guard caught a leak/disallowed content | Expected; safe fallback persisted |
| Wrong/unexpected model used | Allow-list excludes the character's model | Resolution falls back to default → first allowed; fix the allow-list or character `ai_model` |
| Memories never appear | `privacy_store_memory` off / incognito | Expected; check `user_settings` |
| Slow first token | Cold start or slow model | Streaming hides it; consider a faster default model |

---

## 3. Coins & Economy

| Symptom | Likely cause | Fix |
|---|---|---|
| `"insufficient_coins"` (402) | Balance < action cost | Expected; user must wait for refill or upgrade; admin can grant |
| Coins double-charged | Idempotency key collision/missing | Should not happen — spend uses `chat:userId:msgId`; inspect `coin_ledger` |
| Balance ≠ ledger | Drift | `select * from coin_balance_check where drift <> 0;` then investigate the offending profile |
| Signup bonus granted twice | Idempotency key not applied | Verify `signup:<userId>` on the grant (one-time per user) |
| Monthly coins not granted after payment | `invoice.paid` webhook failed | Check Stripe webhook logs; re-send event (grant is idempotent on `sub_grant:<invoiceId>`) |

---

## 4. Payments & Subscriptions

| Symptom | Likely cause | Fix |
|---|---|---|
| Upgrade returns no checkout URL | `BILLING_DEV_BYPASS` on or Stripe unconfigured | In prod, set bypass off + configure Stripe keys/price ids |
| Paid but still on free plan | `checkout.session.completed` webhook failed or missing metadata | Check `STRIPE_WEBHOOK_SECRET`, webhook endpoint URL, and that `profile_id`/`plan` metadata is set |
| Webhook signature invalid (400) | Wrong `STRIPE_WEBHOOK_SECRET` for this endpoint | Use the secret for the *specific* endpoint; each endpoint has its own |
| "Unknown price id" warning | `STRIPE_PRICE_PREMIUM/ULTIMATE` mismatch | Align env price ids with Stripe dashboard products |
| Cancellation didn't downgrade | `customer.subscription.deleted` not received | Verify webhook; user keeps access until period end by design |
| Duplicate billing records | — | Prevented by unique `external_ref`; safe to replay |

---

## 5. Uploads & Media

| Symptom | Likely cause | Fix |
|---|---|---|
| Upload rejected | Type not image/video, or > 10 MB | Expected validation; inform user |
| Presigned PUT fails | R2 keys/bucket wrong, or clock skew | Run `npm run test:r2`; verify `R2_*` env ([20](20-r2-storage-testing.md)) |
| Image not displaying | Host not in `next.config.ts` `remotePatterns` | Add the R2 public host / Supabase storage host |

---

## 6. Rate Limiting

| Symptom | Likely cause | Fix |
|---|---|---|
| Routes return 503 "Rate limiting unavailable" | Prod without Upstash configured | Set `UPSTASH_REDIS_REST_URL/TOKEN` |
| Frequent 429 | Limits too tight or abuse | Tune `apiLimiter`/`subscriptionLimiter`; investigate the user/IP |
| No rate limiting in dev | Upstash unset (no-ops in dev) | Expected; set Upstash to test it locally |

---

## 7. Database & RLS

| Symptom | Likely cause | Fix |
|---|---|---|
| Query returns no rows unexpectedly | RLS scoped to a different `sub`, or wrong client | Use the right Supabase client; confirm JWT `sub` |
| "no balance row" on spend | `coin_balances` row missing | Webhook bootstrap failed; grant/initialize balance |
| Can't delete a character | `conversations` reference it (`ON DELETE RESTRICT`) | Unpublish instead, or remove conversations first |
| Type errors after migration | `database.ts` stale | Regenerate Supabase types |

---

## 8. Build & Deploy

| Symptom | Likely cause | Fix |
|---|---|---|
| CI build fails on lint | ESLint violations | `npm run lint` locally; fix |
| Runtime error referencing a column | Migration not applied to that environment | Apply migrations before/with the deploy |
| Works in dev, breaks in prod | `BILLING_DEV_BYPASS`/Upstash/env differences | Diff env between environments |
| `server-only` import error | Server module imported from client code | Move the import server-side |

---

## 9. Diagnostic Quick-Reference

```bash
# coin integrity
select * from coin_balance_check where drift <> 0;

# recent security events (table per security/audit.ts)
select * from <security_events_table> order by created_at desc limit 50;

# a user's recent ledger
select * from coin_ledger where profile_id = '<id>' order by created_at desc limit 20;

# subscription state
select * from subscriptions where profile_id = '<id>';
```

> When in doubt: **Stripe dashboard** for payment truth, **Clerk dashboard** for identity truth, **Supabase** for app-state truth, and the **host logs** for runtime errors. Cross-check the three sources of truth before concluding a bug.
