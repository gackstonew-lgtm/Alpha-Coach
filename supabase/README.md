# Alpha Coach - Supabase Database Architecture & Migrations

This directory contains the production-grade PostgreSQL migrations, Row Level Security (RLS) policies, authentication triggers, and storage configurations for the **Alpha Coach MT5 Trading Journal & Performance OS**.

---

## Migration Catalog

| Migration File | Description | Key Objects Created / Configured |
|---|---|---|
| [`20260925000001_initial_schema.sql`](./migrations/20260925000001_initial_schema.sql) | **Master Relational DDL** | 22 relational tables (`users`, `user_profiles`, `trading_accounts`, `bridge_devices`, `raw_orders`, `raw_deals`, `reconstructed_positions`, `position_executions`, `strategies`, `mistake_tags`, `trade_journals`, `trade_screenshots`, `risk_rules`, `risk_alerts`, `trader_progression`, `achievements`, `user_achievements`, `reports`, `economic_events`, `sync_checkpoints`, `audit_logs`, `notifications`), UUID triggers, automatic `updated_at` handlers. |
| [`20260925000002_indexes.sql`](./migrations/20260925000002_indexes.sql) | **Query Performance Indexes** | B-Tree and composite indexes on `(account_id, open_time)`, `(user_id, is_reviewed)`, `(symbol)`, `(device_token)`, and `(is_acknowledged)`. |
| [`20260925000003_rls_policies.sql`](./migrations/20260925000003_rls_policies.sql) | **Row Level Security (RLS)** | Full tenant isolation per user (`auth.uid() = user_id`), join-based access control for nested tables, and privileged bypass for backend `service_role` MT5 ingestion. |
| [`20260925000004_auth_triggers.sql`](./migrations/20260925000004_auth_triggers.sql) | **Supabase Auth Hook** | Automated trigger on `auth.users` that creates default `public.users`, `public.user_profiles`, `public.trader_progression`, and `public.risk_rules` upon user registration. |
| [`20260925000005_storage_buckets.sql`](./migrations/20260925000005_storage_buckets.sql) | **Storage Buckets & Policies** | S3-compatible buckets (`trade-screenshots`, `voice-audio`, `reports`) with strict MIME types and access policies. |

---

## How to Apply Migrations

### Option A: Using the Supabase Web Dashboard (Recommended)
1. Navigate to your project dashboard: `https://supabase.com/dashboard/project/rmnudqejyrrklltodiaf`
2. Open the **SQL Editor** tab from the left sidebar.
3. Open and run the migration files in order:
   - Run `20260925000001_initial_schema.sql`
   - Run `20260925000002_indexes.sql`
   - Run `20260925000003_rls_policies.sql`
   - Run `20260925000004_auth_triggers.sql`
   - Run `20260925000005_storage_buckets.sql`
4. Confirm successful execution.

### Option B: Using the Supabase CLI
```bash
# Link local project to remote Supabase project
npx supabase link --project-ref rmnudqejyrrklltodiaf

# Push all migrations
npx supabase db push
```

---

## Security Architecture

- **Client-side (Frontend)**: Only uses `VITE_SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_ANON_KEY`. All operations in the browser are constrained by PostgreSQL Row Level Security (RLS).
- **Server-side (Backend API & MT5 Bridge)**: Uses `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` inside protected backend services (`backend/src/lib/supabase.ts`) to ingest MT5 history deals and calculate analytics without exposing secrets to the browser.
