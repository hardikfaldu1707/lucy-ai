/**
 * API smoke test — hits key routes without auth and checks status + JSON shape.
 * Requires the dev server (or deployed app) to be running.
 *
 * Run:  npm run test:api
 *       SMOKE_BASE_URL=https://your-preview.vercel.app npm run test:api
 */
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const BASE_URL = (process.env.SMOKE_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** @typedef {{ name: string; method?: string; path: string; expect: number | number[]; check?: (body: unknown) => string | null }} SmokeCase */

/** @type {SmokeCase[]} */
const CASES = [
  // ── Public / anonymous-safe ──────────────────────────────────────────────
  {
    name: "Home character catalog",
    path: "/api/characters",
    expect: 200,
    check: (b) => (Array.isArray(b?.characters) ? null : "expected { characters: [] }"),
  },
  {
    name: "AI models (public)",
    path: "/api/ai-models",
    expect: 200,
    check: (b) =>
      Array.isArray(b?.models) && typeof b?.defaultModel === "string"
        ? null
        : "expected { models: [], defaultModel: string }",
  },
  {
    name: "Voice config",
    path: "/api/voice/config",
    expect: 200,
    check: (b) =>
      typeof b?.enabled === "boolean" && b?.signedIn === false ? null : "expected signedIn: false",
  },
  {
    name: "Coin packs",
    path: "/api/coins/packs",
    expect: 200,
    check: (b) =>
      Array.isArray(b?.packs) && typeof b?.enabled === "boolean" ? null : "expected { packs, enabled }",
  },
  {
    name: "Chat browse characters",
    path: "/api/characters/chat-browse",
    expect: 200,
    check: (b) => (Array.isArray(b?.characters) ? null : "expected { characters: [] }"),
  },
  {
    name: "Me (anonymous)",
    path: "/api/me",
    expect: 200,
    check: (b) => (b?.isAdmin === false ? null : "expected { isAdmin: false }"),
  },
  {
    name: "Feature flags (anonymous)",
    path: "/api/flags",
    expect: 200,
    check: (b) => (b?.flags && typeof b.flags === "object" ? null : "expected { flags: {} }"),
  },

  // ── Auth-required (no session → 401) ─────────────────────────────────────
  {
    name: "Profile (auth required)",
    path: "/api/profile",
    expect: 401,
  },
  {
    name: "Coin balance (auth required)",
    path: "/api/coins/balance",
    expect: 401,
  },
  {
    name: "Conversations (auth required)",
    path: "/api/chat/conversations",
    expect: 401,
  },
  {
    name: "GIF search (auth required)",
    path: "/api/gifs/search",
    expect: 401,
  },
  {
    name: "Upload (auth required)",
    method: "POST",
    path: "/api/upload",
    expect: 401,
  },
  {
    name: "Create character (auth required)",
    method: "POST",
    path: "/api/characters",
    expect: 401,
  },

  // ── Admin (no session → 403) ─────────────────────────────────────────────
  {
    name: "Admin stats (forbidden)",
    path: "/api/admin/stats",
    expect: 403,
    check: (b) => (b?.error === "Forbidden" ? null : 'expected { error: "Forbidden" }'),
  },
  {
    name: "Admin characters (forbidden)",
    path: "/api/admin/characters",
    expect: 403,
    check: (b) => (b?.error === "Forbidden" ? null : 'expected { error: "Forbidden" }'),
  },
  {
    name: "Admin users (forbidden)",
    path: "/api/admin/users",
    expect: 403,
    check: (b) => (b?.error === "Forbidden" ? null : 'expected { error: "Forbidden" }'),
  },
  {
    name: "Admin AI models (forbidden)",
    path: "/api/admin/ai-models",
    expect: 403,
    check: (b) => (b?.error === "Forbidden" ? null : 'expected { error: "Forbidden" }'),
  },
];

function ok(label, detail = "") {
  console.log(`  ✅ ${label}${detail ? ` — ${detail}` : ""}`);
}

function fail(label, detail = "") {
  console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`);
}

function section(title) {
  console.log(`\n▶ ${title}`);
}

function accepts(status, expected) {
  return Array.isArray(expected) ? expected.includes(status) : status === expected;
}

async function pingServer() {
  try {
    const res = await fetch(`${BASE_URL}/api/me`, { signal: AbortSignal.timeout(10_000) });
    return res.ok || res.status === 401 || res.status === 403;
  } catch {
    return false;
  }
}

async function runCase(test) {
  const method = test.method ?? "GET";
  const url = `${BASE_URL}${test.path}`;
  const res = await fetch(url, {
    method,
    headers: method !== "GET" ? { "Content-Type": "application/json" } : undefined,
    body: method !== "GET" ? "{}" : undefined,
    signal: AbortSignal.timeout(30_000),
  });

  let body = null;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      body = await res.json();
    } catch {
      body = null;
    }
  }

  if (!accepts(res.status, test.expect)) {
    return { pass: false, detail: `HTTP ${res.status}, expected ${test.expect}` };
  }

  if (test.check) {
    const checkErr = test.check(body);
    if (checkErr) return { pass: false, detail: checkErr };
  }

  return { pass: true, detail: `HTTP ${res.status}` };
}

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  Lucy AI — API Smoke Test");
  console.log("═══════════════════════════════════════");
  console.log(`  Base URL: ${BASE_URL}`);

  section("0. Server reachability");
  const up = await pingServer();
  if (!up) {
    fail("Server not reachable", `Start with: npm run dev  (or set SMOKE_BASE_URL)`);
    process.exit(1);
  }
  ok("Server responding");

  let passed = 0;
  let failed = 0;

  section("1. Route smoke checks");
  for (const test of CASES) {
    try {
      const result = await runCase(test);
      if (result.pass) {
        ok(test.name, result.detail);
        passed++;
      } else {
        fail(test.name, result.detail);
        failed++;
      }
    } catch (e) {
      fail(test.name, e instanceof Error ? e.message : String(e));
      failed++;
    }
  }

  console.log("\n═══════════════════════════════════════");
  console.log(`  Result: ${passed} passed, ${failed} failed`);
  console.log("═══════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("\nFatal:", e.message);
  process.exit(1);
});
