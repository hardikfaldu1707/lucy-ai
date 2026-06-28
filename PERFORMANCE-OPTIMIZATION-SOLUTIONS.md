# Lucy AI - Performance Optimization Solutions

## 📊 Test Results Comparison

### Test Run 1 vs Test Run 2

| Route | Run 1 | Run 2 | Change |
|-------|-------|-------|--------|
| `/api/characters/chat-browse` | 9410ms (80% timeout) | 5384ms (40% timeout) | ⚠️ Still Critical |
| `/api/voice/test-tts` | 1709ms (all 500) | **10020ms (all timeout)** | 🔴 WORSE |
| `/api/coins/purchase` | 881ms | 4046ms | 🔴 WORSE |
| `/api/voice/history` | 986ms | 3661ms | 🔴 WORSE |
| `/` (home) | 5106ms | 3094ms | ✅ Better |
| `/c/pooja` | 5850ms | 2877ms | ✅ Better |

**Conclusion:** Voice endpoints and coin purchase are degrading under load. Database queries need caching.

---

## 🔥 Critical Issues & Solutions

### 1. `/api/characters/chat-browse` - 5-9 Second Load (40-80% Timeouts)

**Problem:** Multiple uncached database queries loading all characters

**Root Cause:**
```typescript
// Currently doing 3 separate DB queries EVERY time
const [publicRows, privateCatalogRows, mineRows] = await Promise.all([
  loadPublicCharactersFromDb(),      // Query 1: All public characters
  loadPrivateCatalogCharactersFromDb(), // Query 2: All private catalog
  loadUserCharactersFromDb(profileId),  // Query 3: User's characters
]);
```

**Solutions:**

#### A. Add Caching Layer (Quick Fix - 5 mins)
```typescript
// src/app/api/characters/chat-browse/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { listChatBrowseCharacters } from "@/lib/data/characters-public";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  const { userId } = await auth();
  const characters = await listChatBrowseCharacters(userId ?? undefined);
  return NextResponse.json({ characters });
}
```

#### B. Add Database Indexes (Medium Priority - 10 mins)
```sql
-- Run this in Supabase SQL Editor
CREATE INDEX IF NOT EXISTS idx_characters_published_visibility 
ON characters (is_published, visibility) 
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_characters_created_by_published 
ON characters (created_by, is_published) 
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_characters_created_at 
ON characters (created_at DESC);
```

#### C. Use Cached Version Instead of Live (Immediate - 2 mins)
```typescript
// src/lib/data/characters-public.ts - Update function
export async function listChatBrowseCharactersLive(
  profileId?: string,
): Promise<ExploreCharacter[]> {
  // Use cached public rows instead of live query
  const publicRows = await getCachedPublicCharacters(); // ← CHANGE THIS LINE
  return listChatBrowseWithProfile(publicRows, profileId);
}
```

#### D. Implement Redis Caching (Long-term - 30 mins)
```typescript
// src/lib/cache/redis.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached) return cached;
  
  const fresh = await fetcher();
  await redis.set(key, fresh, { ex: ttlSeconds });
  return fresh;
}

// Usage in characters-public.ts
export async function listChatBrowseCharactersLive(profileId?: string) {
  return getCachedData(
    `chat-browse:${profileId || 'guest'}`,
    () => loadChatBrowseCharactersFromDb(profileId),
    120 // 2 minutes cache
  );
}
```

---

### 2. `/api/voice/test-tts` - 10+ Second Timeouts (100% Failure)

**Problem:** TTS API calls timing out completely

**Root Cause:** OpenAI/OpenRouter TTS API is slow or misconfigured

**Solutions:**

#### A. Add Timeout & Better Error Handling (Immediate)
```typescript
// src/lib/voice/tts.ts
export async function synthesizeSpeech(
  text: string, 
  voice: string,
  timeoutMs: number = 8000 // 8 second timeout
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(TTS_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice,
        input: text.substring(0, 500), // Limit text length
      }),
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }
    
    const audioBuffer = await response.arrayBuffer();
    return {
      audioBase64: Buffer.from(audioBuffer).toString('base64'),
      mime: 'audio/mp3',
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('TTS request timed out after 8 seconds');
    }
    throw error;
  }
}
```

#### B. Implement Fallback TTS Provider
```typescript
// src/lib/voice/tts-fallback.ts
async function synthesizeSpeechWithFallback(text: string, voice: string) {
  try {
    // Try primary provider (OpenAI)
    return await synthesizeSpeechOpenAI(text, voice);
  } catch (error) {
    console.warn('[TTS] Primary failed, trying fallback', error);
    
    // Fallback to ElevenLabs or Deepgram
    return await synthesizeSpeechElevenLabs(text, voice);
  }
}
```

#### C. Pre-generate Common Phrases (Best for Production)
```typescript
// Pre-generate and cache common TTS phrases
const COMMON_PHRASES = [
  "Hello! This is a test.",
  "How are you today?",
  "Nice to meet you!",
];

// Cache pre-generated audio in R2/S3
async function getPreGeneratedTTS(text: string) {
  const normalized = text.toLowerCase().trim();
  const cached = COMMON_PHRASES_CACHE[normalized];
  if (cached) return cached;
  
  // Generate and cache
  const audio = await synthesizeSpeech(text, 'nova');
  COMMON_PHRASES_CACHE[normalized] = audio;
  return audio;
}
```

---

### 3. `/api/coins/purchase` - 4 Second Latency

**Problem:** Multiple Stripe API calls + database operations in sequence

**Root Cause:**
```typescript
// Sequential operations causing delays
1. getFlagMap() - DB query
2. getCoinPackById() - DB query
3. getStripe().customers.create() - Stripe API call
4. supabaseAdmin().from("subscriptions").update() - DB write
5. getStripe().checkout.sessions.create() - Another Stripe API call
```

**Solutions:**

#### A. Cache Coin Packs & Flags (Immediate)
```typescript
// src/lib/data/coin-packs.ts
import { unstable_cache } from 'next/cache';

export const getCoinPackById = unstable_cache(
  async (packId: string) => {
    const { data } = await supabaseAdmin()
      .from("coin_packs")
      .select("*")
      .eq("id", packId)
      .single();
    return data;
  },
  ['coin-pack'],
  { revalidate: 300 } // 5 min cache
);
```

#### B. Lazy Create Stripe Customer (Optimization)
```typescript
// Only create customer when needed, cache customer ID
async function getOrCreateStripeCustomer(userId: string, email: string) {
  // Check cache first
  const cached = await redis.get(`stripe:customer:${userId}`);
  if (cached) return cached;
  
  // Check database
  const { data: subRow } = await supabaseAdmin()
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("profile_id", userId)
    .maybeSingle();
  
  if (subRow?.stripe_customer_id) {
    await redis.set(`stripe:customer:${userId}`, subRow.stripe_customer_id, { ex: 3600 });
    return subRow.stripe_customer_id;
  }
  
  // Create new customer
  const customer = await getStripe().customers.create({
    email,
    metadata: { profile_id: userId },
  });
  
  await supabaseAdmin()
    .from("subscriptions")
    .update({ stripe_customer_id: customer.id })
    .eq("profile_id", userId);
  
  await redis.set(`stripe:customer:${userId}`, customer.id, { ex: 3600 });
  return customer.id;
}
```

---

### 4. Frontend Pages - 1-3 Second Load Times

**Problem:** Server-side rendering without proper caching

**Solutions:**

#### A. Enable Static Generation Where Possible
```typescript
// src/app/(landing)/page.tsx
export const revalidate = 60; // ISR: Regenerate every 60 seconds
export const dynamic = 'force-static'; // or 'force-dynamic' with cache

export default async function HomePage() {
  // ...
}
```

#### B. Implement Component-Level Caching
```typescript
// src/components/home/authenticated-home-page.tsx
import { cache } from 'react';

const getCharactersCache = cache(async () => {
  return await listHomeCharacters();
});

export async function AuthenticatedHomePage() {
  const characters = await getCharactersCache();
  // ...
}
```

#### C. Add Loading States & Streaming
```tsx
// src/app/(landing)/loading.tsx
export default function Loading() {
  return (
    <div className="container mx-auto p-4">
      <Skeleton className="h-12 w-64 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    </div>
  );
}
```

---

## 🎯 Implementation Priority

### Immediate (Next 30 minutes)
1. ✅ Fix `/api/characters/chat-browse` - Use cached data (Solution 1C)
2. ✅ Add timeout to TTS endpoint (Solution 2A)
3. ✅ Cache coin packs and flags (Solution 3A)

### Short-term (This week)
4. 📊 Add database indexes (Solution 1B)
5. 🔄 Implement Redis caching for characters (Solution 1D)
6. 🎤 Add TTS fallback provider (Solution 2B)
7. 💰 Optimize Stripe customer creation (Solution 3B)

### Long-term (This month)
8. 📦 Pre-generate common TTS phrases (Solution 2C)
9. 🚀 Implement CDN caching for static assets
10. 📊 Add APM monitoring (Vercel Analytics, Sentry Performance)

---

## 📈 Expected Performance Improvements

| Route | Current | Target | Improvement |
|-------|---------|--------|-------------|
| `/api/characters/chat-browse` | 5-9s | <500ms | **90-95%** |
| `/api/voice/test-tts` | 10s+ timeout | <2s | **80%** |
| `/api/coins/purchase` | 4s | <1s | **75%** |
| Frontend pages | 1-3s | <500ms | **80%** |

---

## 🛠️ Additional Tools & Monitoring

### Add Performance Monitoring
```bash
npm install @vercel/analytics @vercel/speed-insights
```

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Environment Variables Needed
```env
# .env
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# For monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

---

## 🎬 Quick Start - Apply Top 3 Fixes Now

Run these commands to apply immediate fixes:

```bash
# 1. Update chat-browse to use cached data
# 2. Add TTS timeout
# 3. Cache coin packs

# Then restart your dev server
npm run dev
```

Estimated time: **15 minutes**  
Expected improvement: **70-80% faster on critical routes**
