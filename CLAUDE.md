# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack (http://localhost:3000)
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code linting
- `npm run test:r2` - Test Cloudflare R2 storage integration

## Code Architecture & Structure

### Project Organization
- **App Router**: Next.js 16 App Router under `src/app/` with route groups:
  - `(marketing)` - Public marketing pages (home, features, pricing, etc.)
  - `(dashboard)` - Authenticated user experience (chat, character creation, profile)
  - `(admin)` - Admin panel (character management, user management, analytics)
  - `(auth)` - Sign-in and sign-up pages
- **API Routes**: Serverless functions under `src/app/api/` for backend logic
- **Components**: 
  - `src/components/ui/` - shadcn/ui primitives (Tailwind-based)
  - Domain-specific components in `src/components/chat/`, `character/`, `voice/`, `admin/`
- **Libraries**: 
  - `src/lib/` - Utilities, data layer, AI integrations, auth helpers
  - Key modules: `ai/` (OpenRouter), `supabase/` (DB clients), `storage/` (R2), `data/` (server data layer)
- **State Management**:
  - TanStack Query for server state/data fetching
  - Zustand for client-side UI state (in `src/store/`)
  - React Hook Form + Zod for form validation

### Key Conventions (from Cursor rules)
- **Routing**: Use constants from `src/constants/routes.ts` for links/redirects (never hardcode paths)
- **Rendering**: Prefer Server Components; add `"use client"` only when needed for interactivity/hooks/browser APIs
- **Styling**: Tailwind CSS v4; use `cn()` utility from `src/lib/utils.ts` for class merging
- **Forms**: React Hook Form + Zod validation schemas (located in feature-specific `schemas.ts` files)
- **Types**: Shared types in `src/types/`; keep API response shapes aligned with data layer return types
- **Authentication**: 
  - Clerk handles user sessions
  - Admin access requires `metadata.role === "admin"` in Clerk session (checked in `src/proxy.ts` and `src/lib/auth/require-admin.ts`)
  - User profiles synced to Supabase via Clerk webhook

### Data Flow
1. **Browser** → Next.js App Router
2. **Auth**: Clerk proxy → Supabase profiles (via webhook)
3. **API Routes** (`/api/*`):
   - OpenRouter → AI chat responses
   - Supabase → Data persistence (RLS-scoped for users, service-role for admin/webhooks)
   - Cloudflare R2 → File/object storage (via AWS SDK)
4. **Storage**: 
   - Supabase (PostgreSQL) for relational data with Row-Level Security
   - Cloudflare R2 for binary assets (character images, uploads)
   - Upstash Redis for rate limiting

### Important Files & Patterns
- **Admin Guards**: `src/proxy.ts` and `src/lib/auth/require-admin.ts`
- **Supabase Clients**: 
  - `src/lib/supabase/server.ts` (RLS-scoped, user requests)
  - `src/lib/supabase/admin.ts` (service-role, bypasses RLS for trusted operations)
- **AI Chat**: `src/lib/ai/character-chat.ts` (OpenRouter integration with usage logging)
- **Storage**: `src/lib/storage/r2.ts` (Cloudflare R2 presigned URLs and operations)
- **Database**: Migrations in `supabase/migrations/`; regenerate types with `npx supabase gen types typescript --project-id <id> > src/types/database.ts`

## Common Development Tasks

### Adding New Features
1. For user-facing features: Add to `(dashboard)` route group
2. For marketing/content: Add to `(marketing)` route group  
3. For admin features: Add to `(admin)/admin/` route group
4. API endpoints: Add under `src/app/api/` following existing patterns
5. Database changes: Add numbered migration in `supabase/migrations/` and update `src/types/database.ts`
6. Component creation: Follow existing patterns in `src/components/`; use shadcn/ui primitives from `ui/`

### Testing & Verification
- Manual testing: Use `npm run dev` and interact with the application
- Linting: Run `npm run lint` before committing
- Type checking: Next.js provides built-in TypeScript checking during dev/build
- R2 testing: Use `npm run test:r2` to verify Cloudflare R2 configuration

### Environment Setup
1. Copy `.env.example` to `.env.local` and fill in required values:
   - Clerk authentication keys
   - Supabase URL and keys (including service_role)
   - OpenRouter API key
   - Cloudflare R2 credentials
   - Upstash Redis (required for production rate limiting)
   - Stripe keys (for billing/subscriptions)
2. Apply database migrations to Supabase instance
3. Run `npm install` to install dependencies
4. Start development server with `npm run dev`

## Key Technical Details

### Rate Limiting
- Uses Upstash Redis for protecting API endpoints
- Required in production; optional in development
- Implemented via middleware or direct API route protection

### File Uploads
- Direct-to-R2 uploads via presigned URLs (`/api/upload`)
- Files tracked in `media_assets` table for storage accounting
- Admin can manage files via `/admin/storage`

### AI Integration
- OpenRouter provides unified access to multiple LLMs
- Per-character configurable model and system prompt
- Token usage and cost logged per reply in `ai_usage_log` table
- Streaming responses supported via NDJSON

### Privacy & Security
- Chat content is private at the database level (admins cannot read messages)
- Admin access to user data is permitted but chat content remains inaccessible
- Row-Level Security (RLS) enforced on Supabase for user data isolation
- Service-role client used only for trusted operations (webhooks, admin, analytics)
