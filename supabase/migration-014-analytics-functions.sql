-- Migration 014: Analytics RPC functions and performance indexes
-- PRD-14: Analytics Dashboard
-- Idempotent: uses CREATE OR REPLACE and IF NOT EXISTS

-- ─── RPC: Active user count (cross-client) ───
create or replace function count_active_users(since_date timestamptz)
returns integer as $$
  select count(distinct user_id)::integer
  from (
    select user_id from level_progress where updated_at >= since_date
    union
    select user_id from saved_prompts where saved_at >= since_date
    union
    select user_id from application_insights where created_at >= since_date
  ) active_users;
$$ language sql stable;

-- ─── RPC: Active user count (per-org) ───
create or replace function count_active_users_for_org(
  target_org_id uuid,
  since_date timestamptz
) returns integer as $$
  select count(distinct au.user_id)::integer
  from (
    select user_id from level_progress where updated_at >= since_date
    union
    select user_id from saved_prompts where saved_at >= since_date
    union
    select user_id from application_insights where created_at >= since_date
  ) au
  join user_org_memberships m on m.user_id = au.user_id
  where m.org_id = target_org_id and m.active = true;
$$ language sql stable;

-- ─── Performance indexes for analytics queries ───

-- Speed up activity lookups by date
create index if not exists idx_level_progress_updated on level_progress(updated_at desc);
create index if not exists idx_saved_prompts_saved_at on saved_prompts(saved_at desc);
create index if not exists idx_insights_created on application_insights(created_at desc);

-- Speed up per-user lookups
create index if not exists idx_level_progress_user on level_progress(user_id);
create index if not exists idx_saved_prompts_user on saved_prompts(user_id);
create index if not exists idx_insights_user on application_insights(user_id);
