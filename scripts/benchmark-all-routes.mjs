import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const BASE_URL = (process.env.SMOKE_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

const ROUTES = [
  // ── Frontend Routes (Pages) ──
  { type: "Frontend", path: "/" },
  { type: "Frontend", path: "/pricing" },
  { type: "Frontend", path: "/faq" },
  { type: "Frontend", path: "/features" },
  { type: "Frontend", path: "/privacy" },
  { type: "Frontend", path: "/terms" },
  { type: "Frontend", path: "/contact" },
  { type: "Frontend", path: "/explore" },
  { type: "Frontend", path: "/chat" },
  { type: "Frontend", path: "/chat/new" },
  { type: "Frontend", path: "/chat/voice" },
  { type: "Frontend", path: "/chat/pooja" },
  { type: "Frontend", path: "/c/pooja" },
  { type: "Frontend", path: "/create" },
  { type: "Frontend", path: "/generate" },
  { type: "Frontend", path: "/my/pooja" },
  { type: "Frontend", path: "/my/pooja/chat" },
  { type: "Frontend", path: "/my/pooja/edit" },
  { type: "Frontend", path: "/sign-in" },
  { type: "Frontend", path: "/sign-up" },
  { type: "Frontend", path: "/dashboard" },
  { type: "Frontend", path: "/dashboard/characters" },
  { type: "Frontend", path: "/dashboard/characters/new" },
  { type: "Frontend", path: "/dashboard/characters/test-char-123" },
  { type: "Frontend", path: "/dashboard/chat" },
  { type: "Frontend", path: "/dashboard/chat/test-char-123" },
  { type: "Frontend", path: "/dashboard/memory" },
  { type: "Frontend", path: "/dashboard/my-girls" },
  { type: "Frontend", path: "/dashboard/profile" },
  { type: "Frontend", path: "/dashboard/settings" },
  { type: "Frontend", path: "/dashboard/subscription" },
  { type: "Frontend", path: "/dashboard/voice" },
  { type: "Frontend", path: "/admin" },
  { type: "Frontend", path: "/admin/ai-models" },
  { type: "Frontend", path: "/admin/characters" },
  { type: "Frontend", path: "/admin/cohorts" },
  { type: "Frontend", path: "/admin/coin-packs" },
  { type: "Frontend", path: "/admin/contact" },
  { type: "Frontend", path: "/admin/memories" },
  { type: "Frontend", path: "/admin/payments" },
  { type: "Frontend", path: "/admin/reports" },
  { type: "Frontend", path: "/admin/settings" },
  { type: "Frontend", path: "/admin/storage" },
  { type: "Frontend", path: "/admin/subscriptions" },
  { type: "Frontend", path: "/admin/tenants" },
  { type: "Frontend", path: "/admin/usage" },
  { type: "Frontend", path: "/admin/users" },
  { type: "Frontend", path: "/admin/users/test-user-123" },

  // ── Backend API Routes ──
  { type: "API", path: "/api/ai-models" },
  { type: "API", path: "/api/flags" },
  { type: "API", path: "/api/me" },
  { type: "API", path: "/api/profile" },
  { type: "API", path: "/api/contact" },
  { type: "API", path: "/api/reports" },
  { type: "API", path: "/api/upload" },
  { type: "API", path: "/api/notifications" },
  { type: "API", path: "/api/characters" },
  { type: "API", path: "/api/characters/chat-browse" },
  { type: "API", path: "/api/characters/mine" },
  { type: "API", path: "/api/characters/test-char-123" },
  { type: "API", path: "/api/characters/test-char-123/favorite" },
  { type: "API", path: "/api/characters/test-char-123/photos" },
  { type: "API", path: "/api/characters/test-char-123/photos/unlock" },
  { type: "API", path: "/api/chat/conversations" },
  { type: "API", path: "/api/chat/start" },
  { type: "API", path: "/api/chat/read-aloud" },
  { type: "API", path: "/api/chat/guest/status" },
  { type: "API", path: "/api/chat/guest/messages" },
  { type: "API", path: "/api/chat/test-id-123" },
  { type: "API", path: "/api/chat/test-id-123/messages" },
  { type: "API", path: "/api/chat/test-id-123/image" },
  { type: "API", path: "/api/chat/test-id-123/settings" },
  { type: "API", path: "/api/chat/test-id-123/character-photo" },
  { type: "API", path: "/api/chat/test-id-123/request-media" },
  { type: "API", path: "/api/coins/balance" },
  { type: "API", path: "/api/coins/packs" },
  { type: "API", path: "/api/coins/ledger" },
  { type: "API", path: "/api/coins/purchase" },
  { type: "API", path: "/api/coins/usage-by-character" },
  { type: "API", path: "/api/memories" },
  { type: "API", path: "/api/memories/characters" },
  { type: "API", path: "/api/memories/test-mem-123" },
  { type: "API", path: "/api/onboarding/complete" },
  { type: "API", path: "/api/push/subscribe" },
  { type: "API", path: "/api/subscription/cancel" },
  { type: "API", path: "/api/subscription/upgrade" },
  { type: "API", path: "/api/voice/config" },
  { type: "API", path: "/api/voice/history" },
  { type: "API", path: "/api/voice/preview" },
  { type: "API", path: "/api/voice/realtime/token" },
  { type: "API", path: "/api/voice/session/start" },
  { type: "API", path: "/api/voice/session/status" },
  { type: "API", path: "/api/voice/session/end" },
  { type: "API", path: "/api/voice/tts" },
  { type: "API", path: "/api/voice/test-tts" },
  { type: "API", path: "/api/voice/utterance" },
  { type: "API", path: "/api/admin/stats" },
  { type: "API", path: "/api/admin/settings" },
  { type: "API", path: "/api/admin/ai-models" },
  { type: "API", path: "/api/admin/ai-models/test" },
  { type: "API", path: "/api/admin/characters" },
  { type: "API", path: "/api/admin/characters/generate-questions" },
  { type: "API", path: "/api/admin/characters/test-char-123" },
  { type: "API", path: "/api/admin/characters/test-char-123/gallery" },
  { type: "API", path: "/api/admin/characters/test-char-123/gallery/0" },
  { type: "API", path: "/api/admin/users" },
  { type: "API", path: "/api/admin/users/test-user-123" },
  { type: "API", path: "/api/admin/subscriptions" },
  { type: "API", path: "/api/admin/payments" },
  { type: "API", path: "/api/admin/cohorts" },
  { type: "API", path: "/api/admin/coin-packs" },
  { type: "API", path: "/api/admin/coin-packs/test-id-123" },
  { type: "API", path: "/api/admin/contact" },
  { type: "API", path: "/api/admin/contact/test-id-123" },
  { type: "API", path: "/api/admin/memories" },
  { type: "API", path: "/api/admin/reports" },
  { type: "API", path: "/api/admin/reports/test-id-123" },
  { type: "API", path: "/api/admin/usage" },
  { type: "API", path: "/api/admin/unit-economics" },
  { type: "API", path: "/api/admin/media" },
  { type: "API", path: "/api/admin/media/upload" },
  { type: "API", path: "/api/admin/media/test-id-123" },
  { type: "API", path: "/api/webhooks/clerk" },
  { type: "API", path: "/api/webhooks/stripe" }
];

async function benchmarkRoute(route, totalRequests = 5, concurrency = 2) {
  const url = `${BASE_URL}${route.path}`;
  let completed = 0;
  let succeeded = 0;
  const statusCodes = {};
  const latencies = [];

  async function worker() {
    while (completed < totalRequests) {
      const currentId = completed++;
      if (currentId >= totalRequests) break;

      const reqStart = performance.now();
      try {
        const res = await fetch(url, {
          method: "GET",
          signal: AbortSignal.timeout(10000),
        });
        const reqEnd = performance.now();
        latencies.push(reqEnd - reqStart);
        statusCodes[res.status] = (statusCodes[res.status] || 0) + 1;
        if (res.ok || res.status === 401 || res.status === 403 || res.status === 307 || res.status === 302) {
          succeeded++;
        }
      } catch (err) {
        latencies.push(performance.now() - reqStart);
        statusCodes["Timeout/Error"] = (statusCodes["Timeout/Error"] || 0) + 1;
      }
    }
  }

  const workers = Array.from({ length: concurrency }).map(() => worker());
  await Promise.all(workers);

  latencies.sort((a, b) => a - b);
  const avg = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const codes = Object.entries(statusCodes).map(([code, count]) => `${code} (${count})`).join(", ");

  return {
    type: route.type,
    path: route.path,
    avg: Math.round(avg),
    p95: Math.round(p95),
    successRate: `${succeeded}/${totalRequests}`,
    statusCodes: codes
  };
}

async function main() {
  console.log("==============================================");
  console.log("   LUCY AI - COMPLETE ALL-ROUTE BENCHMARK");
  console.log("==============================================");
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Total Routes to Test: ${ROUTES.length}`);
  console.log("Please wait, testing all routes...\n");

  const results = [];
  let count = 0;

  for (const route of ROUTES) {
    count++;
    process.stdout.write(`[${count}/${ROUTES.length}] Testing ${route.type}: ${route.path} ... `);
    try {
      const res = await benchmarkRoute(route, 5, 2);
      console.log(`Avg: ${res.avg}ms | Status: ${res.statusCodes}`);
      results.push(res);
    } catch (e) {
      console.log(`Failed! ${e.message}`);
      results.push({
        type: route.type,
        path: route.path,
        avg: 0,
        p95: 0,
        successRate: "0/5",
        statusCodes: "Error"
      });
    }
  }

  console.log("\n==============================================");
  console.log("               TEST COMPLETED");
  console.log("==============================================");

  // Print results sorted by latency (descending)
  results.sort((a, b) => b.avg - a.avg);

  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
