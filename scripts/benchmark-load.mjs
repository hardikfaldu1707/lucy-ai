import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const BASE_URL = (process.env.SMOKE_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

async function benchmarkRoute(name, path, totalRequests = 100, concurrency = 10) {
  console.log(`\nTesting: ${name} (${path})`);
  console.log(`Total Requests: ${totalRequests} | Concurrency: ${concurrency}`);

  const url = `${BASE_URL}${path}`;
  const start = performance.now();
  let completed = 0;
  let succeeded = 0;
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
        if (res.ok) {
          succeeded++;
        }
      } catch (err) {
        latencies.push(performance.now() - reqStart);
      }
    }
  }

  // Spawn initial workers
  const workers = Array.from({ length: concurrency }).map(() => worker());
  await Promise.all(workers);

  const duration = performance.now() - start;
  latencies.sort((a, b) => a - b);

  const avg = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
  const min = latencies[0] || 0;
  const max = latencies[latencies.length - 1] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const rps = (succeeded / (duration / 1000)).toFixed(2);

  console.log(`----------------------------------------------`);
  console.log(`Success Rate:    ${succeeded}/${totalRequests} (${((succeeded/totalRequests)*100).toFixed(1)}%)`);
  console.log(`Total Duration:  ${(duration / 1000).toFixed(2)}s`);
  console.log(`Throughput:      ${rps} req/sec`);
  console.log(`Min Latency:     ${min.toFixed(1)} ms`);
  console.log(`Max Latency:     ${max.toFixed(1)} ms`);
  console.log(`Avg Latency:     ${avg.toFixed(1)} ms`);
  console.log(`95th Percentile: ${p95.toFixed(1)} ms`);
  console.log(`----------------------------------------------`);

  return { name, path, avg, p95, rps, succeeded, totalRequests };
}

async function main() {
  console.log("==============================================");
  console.log("      LUCY AI - API LOAD BENCHMARK");
  console.log("==============================================");
  console.log(`Target URL: ${BASE_URL}`);

  try {
    // Ping to verify server is running
    const testPing = await fetch(`${BASE_URL}/api/me`, { signal: AbortSignal.timeout(30000) });
  } catch (e) {
    console.error(`Error: Dev server is not running or not reachable at ${BASE_URL}.`);
    console.error("Details:", e.message || e);
    console.error("Please run 'npm run dev' first.");
    process.exit(1);
  }

  await benchmarkRoute("Characters Catalog", "/api/characters", 100, 10);
  await benchmarkRoute("AI Models List", "/api/ai-models", 100, 10);
  await benchmarkRoute("Feature Flags", "/api/flags", 100, 10);
}

main().catch(console.error);
