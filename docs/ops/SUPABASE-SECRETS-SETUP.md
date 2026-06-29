# Kadarn Supabase Secrets Safety Setup

## Overview

This document describes how to safely configure Supabase credentials for local development, staging, and production environments.

## Environment Files

| File | Purpose | Tracked by Git? |
|---|---|---|
| `.env.example` | Template with placeholders | Yes |
| `.env.local` | Local development secrets | No (`.gitignore`) |
| `.env.production` | Production secrets | No (`.gitignore`) |
| `apps/api/.env.local` | API-specific local secrets | No |
| `apps/web/.env.local` | Web-specific local secrets | No |

## Variable Classification

### Public-safe (exposed to browser)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

These variables are prefixed with `NEXT_PUBLIC_` and are bundled into client-side JavaScript. They are visible to anyone who views the page source. The anon key is safe for public exposure because RLS policies enforce row-level security.

### Server-only (never expose to browser)

```
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
```

These variables must NEVER appear in frontend code. The service role key bypasses RLS and grants full access to the database.

## Local Setup

1. Copy the template:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase project values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres
   SUPABASE_PROJECT_ID=your-project-id
   ```

3. For local Supabase development:
   ```bash
   supabase start
   ```
   This auto-configures local credentials.

## GitHub Actions Secrets

Configure these secrets in your GitHub repository:

| Secret Name | Value |
|---|---|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `SUPABASE_PROJECT_ID` | Project ID |

## Leaked Credentials

If you suspect credentials have been leaked:

1. **Rotate the anon key** in Supabase dashboard: Settings > API > Project API keys > Rotate
2. **Rotate the service role key** in Supabase dashboard: Settings > API > Project API keys > Rotate
3. **Update .env.local** with new keys
4. **Update GitHub Actions secrets** with new keys
5. **Run the secret scanner** to verify no old keys remain:
   ```bash
   bash scripts/check-secrets.sh
   ```

## Verifying No Secrets Are Committed

```bash
# Run the secret scanner
bash scripts/check-secrets.sh

# Verify .env files are not tracked
git ls-files | grep -E '\.env$|\.env\.'
```
