# Debug Report — `P2022 Client.deletion_country`

## Symptom
`PrismaClientKnownRequestError: The column 'Client.deletion_country' does not exist in the current database.`
- **Error code**: P2022 (ColumnNotFound)
- **Affected route**: `/dashboard/admin/analytics`
- **Prisma version**: 7.8.0
- **Environment**: Vercel (production)

## Repro Steps
1. Deploy the app to Vercel with the new Supabase DATABASE_URL.
2. Navigate to `/dashboard/admin/analytics` or any page that calls `prisma.client.findMany()`.
3. Error fires immediately — the query attempts to SELECT `deletion_country`, `deletion_name`, `deletion_signature` which are absent from the DB.

## Root Cause
**Schema drift between Prisma and the Supabase database.**

When the database was migrated from Railway to Supabase, the new Supabase instance was seeded only with the base schema (from an earlier `db pull`). Three columns that were later added to `prisma/schema.prisma` for the Client model were **never applied** to the Supabase instance:
- `Client.deletion_country` (TEXT, DEFAULT 'Deutschland')
- `Client.deletion_name` (TEXT, nullable)
- `Client.deletion_signature` (TEXT, nullable)

Prisma 7 with `@prisma/adapter-pg` sends raw SQL that explicitly references these column names. Because they didn't exist, Postgres returned `ColumnNotFound`, which Prisma surfaces as `P2022`.

The error persisted after the initial DB fix because Vercel had **stale serverless function instances** (lambda cold-start cache) still running the old build.

## Fix

### Step 1 — Add missing columns to Supabase (applied via MCP)
```sql
ALTER TABLE "Client"
  ADD COLUMN IF NOT EXISTS "deletion_country" TEXT DEFAULT 'Deutschland',
  ADD COLUMN IF NOT EXISTS "deletion_name" TEXT,
  ADD COLUMN IF NOT EXISTS "deletion_signature" TEXT;
```

### Step 2 — Force Vercel redeploy to evict stale instances
```bash
git commit --allow-empty -m "force: redeploy to pick up Supabase schema changes"
git push
```

## Regression Protection
- **Rule**: Never add columns to `prisma/schema.prisma` without a corresponding SQL migration applied to the target database.
- **Process**: After any schema change, run `npx prisma migrate diff` or manually apply the DDL via Supabase MCP before deploying.
- **Checklist** (add to deployment checklist):
  - [ ] `prisma/schema.prisma` changes reviewed
  - [ ] Corresponding `ALTER TABLE` applied to Supabase
  - [ ] `npx prisma generate` run locally
  - [ ] Build passes locally before push

## Verification
```sql
-- Confirm columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'Client'
  AND column_name IN ('deletion_country', 'deletion_name', 'deletion_signature');
-- Expected: 3 rows returned ✅
```
After force-redeploy, `/dashboard/admin/analytics` should return HTTP 200 with no P2022 error in Vercel logs.
