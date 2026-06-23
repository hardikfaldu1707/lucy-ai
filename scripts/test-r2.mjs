/**
 * R2 connectivity test — upload, read, presign, public URL, delete.
 * Run: npm run test:r2
 */
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const REQUIRED = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_URL",
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

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  Lucy AI — Cloudflare R2 Test");
  console.log("═══════════════════════════════════════");

  const missing = REQUIRED.filter((k) => !process.env[k]);
  section("1. Environment");
  if (missing.length) {
    fail("Missing env vars", missing.join(", "));
    process.exit(1);
  }
  ok("All R2 env vars set");
  ok("Account", process.env.R2_ACCOUNT_ID);
  ok("Bucket", process.env.R2_BUCKET);
  ok("Public URL", process.env.R2_PUBLIC_URL);

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  const bucket = process.env.R2_BUCKET;
  const publicBase = process.env.R2_PUBLIC_URL.replace(/\/$/, "");
  const testKey = `__test__/lucy-r2-test-${Date.now()}.txt`;
  const testBody = `Lucy R2 test OK @ ${new Date().toISOString()}`;

  let passed = 0;
  let failed = 0;

  section("2. Upload (PutObject)");
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: testKey,
        Body: testBody,
        ContentType: "text/plain",
      }),
    );
    ok("Uploaded", testKey);
    passed++;
  } catch (e) {
    fail("Upload failed", e.message);
    failed++;
    process.exit(1);
  }

  section("3. Head (object exists)");
  try {
    const head = await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: testKey }),
    );
    ok("Object found", `${head.ContentLength} bytes`);
    passed++;
  } catch (e) {
    fail("Head failed", e.message);
    failed++;
  }

  section("4. List bucket (ListObjectsV2)");
  try {
    const list = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: "__test__/", MaxKeys: 5 }),
    );
    ok("Listed", `${list.KeyCount ?? 0} object(s) under __test__/`);
    passed++;
  } catch (e) {
    fail("List failed", e.message);
    failed++;
  }

  section("5. Presigned PUT URL");
  try {
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: `${testKey}.presign`,
      ContentType: "text/plain",
    });
    const url = await getSignedUrl(client, cmd, { expiresIn: 300 });
    ok("Presigned URL generated", url.slice(0, 60) + "…");
    passed++;
  } catch (e) {
    fail("Presign failed", e.message);
    failed++;
  }

  section("6. Public URL (HTTP GET)");
  const publicUrl = `${publicBase}/${testKey}`;
  try {
    const res = await fetch(publicUrl);
    if (!res.ok) {
      fail("Public fetch", `HTTP ${res.status}`);
      failed++;
    } else {
      const text = await res.text();
      if (text === testBody) {
        ok("Public URL readable", publicUrl);
        passed++;
      } else {
        fail("Public URL body mismatch");
        failed++;
      }
    }
  } catch (e) {
    fail("Public fetch failed", e.message);
    failed++;
  }

  section("7. Cleanup (DeleteObject)");
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));
    ok("Deleted test object");
    passed++;
  } catch (e) {
    fail("Delete failed", e.message);
    failed++;
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
