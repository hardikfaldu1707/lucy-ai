/**
 * Apply browser-upload CORS rules to the R2 bucket (required for presigned PUT >4MB on Vercel).
 * Run: npm run configure:r2-cors
 */
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const REQUIRED = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
];

function originsFromEnv() {
  const origins = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    try {
      origins.add(new URL(appUrl).origin);
    } catch {
      console.warn(`Skipping invalid NEXT_PUBLIC_APP_URL: ${appUrl}`);
    }
  }
  const extra = process.env.R2_CORS_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  for (const o of extra) origins.add(o);
  return [...origins];
}

async function main() {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("Missing env:", missing.join(", "));
    process.exit(1);
  }

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
  const allowedOrigins = originsFromEnv();

  const corsConfiguration = {
    CORSRules: [
      {
        AllowedOrigins: allowedOrigins,
        AllowedMethods: ["GET", "PUT", "HEAD"],
        AllowedHeaders: ["*"],
        ExposeHeaders: ["ETag"],
        MaxAgeSeconds: 3600,
      },
    ],
  };

  console.log("Applying R2 bucket CORS for origins:");
  for (const origin of allowedOrigins) console.log(`  - ${origin}`);

  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: corsConfiguration,
    }),
  );

  const current = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
  console.log("\n✅ CORS updated. Current rules:");
  console.log(JSON.stringify(current.CORSRules, null, 2));
}

main().catch((err) => {
  console.error("Failed to configure R2 CORS:", err.message ?? err);
  process.exit(1);
});
