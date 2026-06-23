# 20 — R2 Storage & Operations

> Cloudflare R2 setup, connectivity testing, key prefixes, and admin file management.

---

## 1. Environment variables

| Cloudflare dashboard | Lucy `.env` | Notes |
|---|---|---|
| Account ID (hex) | `R2_ACCOUNT_ID` | **Not** the full S3 API URL — id only |
| Access Key ID | `R2_ACCESS_KEY_ID` | R2 API token |
| Secret Access Key | `R2_SECRET_ACCESS_KEY` | Server-only |
| Bucket name | `R2_BUCKET` | e.g. `lucy-bucket` |
| Public bucket URL | `R2_PUBLIC_URL` | e.g. `https://pub-xxx.r2.dev` (no trailing slash) |

---

## 2. Quick connectivity test

```bash
# Fill R2_* in .env first
npm run test:r2
```

The script ([`scripts/test-r2.mjs`](../scripts/test-r2.mjs)) runs 7 checks:

1. Env vars present
2. PutObject upload to `__test__/`
3. HeadObject (exists)
4. ListObjects under `__test__/`
5. Presigned PUT URL generation
6. Public URL HTTP GET
7. DeleteObject cleanup

**Expected:** `6 passed, 0 failed`, exit code 0.

---

## 3. Key prefix convention

All files live in one bucket with namespaced keys:

| Prefix | Scope | Who uploads |
|---|---|---|
| `users/{profileId}/` | `user` | Signed-in users (avatars, chat media) |
| `characters/{characterId}/` | `character` | Admin character catalog images |
| `platform/{name}.ext` | `platform` | Admin platform/marketing assets |

Every upload creates a row in `media_assets` (provider `r2`, `scope`, `path`, `url`, `size_bytes`).

---

## 4. Admin Storage page

Route: **`/admin/storage`** (admin role required).

- View all files with preview, owner email, character name, scope, size, date
- Filter by scope (`user` / `character` / `platform`) and type (`image` / `video`)
- Upload platform assets (landing banners, hero images)
- Delete removes object from R2 **and** the `media_assets` row

Dashboard **Storage used (R2)** card sums `media_assets.size_bytes`.

---

## 5. Platform assets on the website

Upload via Admin → Storage with a **platform name** (e.g. `offer-banner`).

The app reads `platform/offer-banner.*` from `media_assets` and uses it on the landing page when present; otherwise falls back to built-in placeholders.

---

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| `Missing env vars` | Set all five `R2_*` in `.env` |
| Upload 403 | Wrong access key/secret or token lacks Object Read & Write |
| Public URL 404/403 | Enable public access on bucket; verify `R2_PUBLIC_URL` |
| Image not showing on site | Add R2 host to `next.config.ts` (see build-time `R2_PUBLIC_URL`) |
| Presign fails | Check `R2_ACCOUNT_ID` matches dashboard account |
| Browser upload "Failed to fetch" | CSP `connect-src` must allow presigned PUT hosts: `{accountId}.r2.cloudflarestorage.com` and `{bucket}.{accountId}.r2.cloudflarestorage.com` (a single `*.r2.cloudflarestorage.com` wildcard does **not** match the bucket-prefixed host). Repo config derives these from `R2_ACCOUNT_ID` / `R2_BUCKET`; restart dev server after env changes. If PUT still fails, configure **bucket CORS** in Cloudflare: origins `http://localhost:3000` + production URL, methods `PUT`/`GET`/`HEAD`, headers `Content-Type` or `*` |

Run `npm run test:r2` first before debugging app uploads.

---

## 7. Security

- Never commit `.env` or paste keys in chat
- Rotate API tokens if leaked
- Test files use `__test__/` prefix and are auto-deleted

---

## 8. Production (Vercel)

Set the same five `R2_*` variables in the Vercel project settings for each environment that needs uploads.
