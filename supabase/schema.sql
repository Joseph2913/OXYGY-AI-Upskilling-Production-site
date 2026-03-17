-- ============================================================
-- Oxygy AI Upskilling — Supabase Schema (matches production DB)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. ORGANISATIONS
create table if not exists organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  tier text check (tier = any (array['foundation', 'accelerator', 'catalyst'])),
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. PROFILES
create table if not exists profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  role text,
  function text,
  function_other text,
  seniority text,
  ai_experience text check (ai_experience = any (array['beginner', 'comfortable-user', 'builder', 'integrator'])),
  ambition text check (ambition = any (array['confident-daily-use', 'build-reusable-tools', 'own-ai-processes', 'build-full-apps', 'lead-ai-strategy'])),
  challenge text,
  availability text check (availability = any (array['1-2 hours', '3-4 hours', '5+ hours'])),
  experience_description text,
  goal_description text,
  onboarding_completed boolean default false,
  current_level integer default 1,
  streak_days integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can read own profile"   on profiles for select using (auth.uid() = id);
create policy "Users can upsert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- 3. LEARNING PLANS
create table if not exists learning_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  pathway_summary text,
  total_estimated_weeks integer,
  levels_data jsonb not null default '{}'::jsonb,
  level_depths jsonb not null default '{}'::jsonb,
  generated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table learning_plans enable row level security;
create policy "Users can read own plans"  on learning_plans for select using (auth.uid() = user_id);
create policy "Users can insert own plans" on learning_plans for insert with check (auth.uid() = user_id);

-- 4. LEVEL PROGRESS
create table if not exists level_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  level int not null check (level >= 1 and level <= 5),
  tool_used boolean default false,
  tool_used_at timestamptz,
  workshop_attended boolean default false,
  workshop_attended_at timestamptz,
  workshop_code_used text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table level_progress enable row level security;
create policy "Users can read own progress"  on level_progress for select using (auth.uid() = user_id);
create policy "Users can upsert own progress" on level_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on level_progress for update using (auth.uid() = user_id);

-- 5. WORKSHOP SESSIONS (admin-managed lookup table)
create table if not exists workshop_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id),
  level int not null check (level >= 1 and level <= 5),
  code text not null,
  session_name text,
  session_date date,
  created_by uuid references auth.users(id),
  active boolean default true,
  created_at timestamptz default now()
);

alter table workshop_sessions enable row level security;
create policy "Authenticated users can read sessions" on workshop_sessions for select using (auth.role() = 'authenticated');

-- 6. SAVED PROMPTS
create table if not exists saved_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  level int not null check (level >= 1 and level <= 5),
  title text not null,
  content text not null,
  source_tool text check (source_tool = any (array['prompt-playground', 'agent-builder', 'workflow-designer', 'dashboard-designer', 'product-architecture'])),
  saved_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table saved_prompts enable row level security;
create policy "Users can read own prompts"   on saved_prompts for select using (auth.uid() = user_id);
create policy "Users can insert own prompts" on saved_prompts for insert with check (auth.uid() = user_id);
create policy "Users can delete own prompts" on saved_prompts for delete using (auth.uid() = user_id);

-- 7. APPLICATION INSIGHTS
create table if not exists application_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  level int not null check (level >= 1 and level <= 5),
  topic text not null,
  context text not null,
  outcome text not null,
  rating int check (rating >= 1 and rating <= 5),
  ai_feedback text,
  ai_feedback_structured jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table application_insights enable row level security;
create policy "Users can read own insights"   on application_insights for select using (auth.uid() = user_id);
create policy "Users can insert own insights" on application_insights for insert with check (auth.uid() = user_id);
create policy "Users can update own insights" on application_insights for update using (auth.uid() = user_id);

-- 8. UI PREFERENCES
create table if not exists ui_preferences (
  user_id uuid primary key references auth.users(id),
  profile_nudge_dismissed boolean default false,
  onboarding_completed boolean default false,
  last_active_dashboard_section text default 'profile',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table ui_preferences enable row level security;
create policy "Users can read own prefs"   on ui_preferences for select using (auth.uid() = user_id);
create policy "Users can upsert own prefs" on ui_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own prefs" on ui_preferences for update using (auth.uid() = user_id);

-- 9. USER ORG MEMBERSHIPS
create table if not exists user_org_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  org_id uuid not null references organisations(id),
  role text not null check (role = any (array['learner', 'facilitator', 'admin'])),
  enrolled_at timestamptz default now(),
  active boolean default true
);

alter table user_org_memberships enable row level security;
create policy "Users can read own memberships" on user_org_memberships for select using (auth.uid() = user_id);

-- 10. ARTEFACTS (consolidated — replaces saved_prompts for new saves)
create table if not exists artefacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references organisations(id),          -- nullable; for future org scoping
  name text not null,
  type text not null check (type in (
    'prompt', 'agent', 'workflow', 'dashboard', 'app_spec', 'build_guide', 'prd'
  )),
  level integer not null check (level between 1 and 5),
  source_tool text check (source_tool in (
    'prompt-playground', 'agent-builder', 'workflow-canvas',
    'dashboard-designer', 'ai-app-evaluator'
  )),
  content jsonb not null default '{}',
  preview text,                                       -- short text preview for card display
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_opened_at timestamptz,
  archived_at timestamptz                             -- soft delete
);

alter table artefacts enable row level security;

create policy "Users can read own artefacts"
  on artefacts for select using (auth.uid() = user_id);
create policy "Users can insert own artefacts"
  on artefacts for insert with check (auth.uid() = user_id);
create policy "Users can update own artefacts"
  on artefacts for update using (auth.uid() = user_id);
create policy "Users can delete own artefacts"
  on artefacts for delete using (auth.uid() = user_id);

create index artefacts_user_level on artefacts(user_id, level);
create index artefacts_user_type on artefacts(user_id, type);
create index artefacts_user_active on artefacts(user_id) where archived_at is null;

-- 11. TOPIC PROGRESS
create table if not exists topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level integer not null check (level between 1 and 5),
  topic_id integer not null,

  -- Current position
  current_phase integer not null default 1 check (current_phase between 1 and 4),
  current_slide integer not null default 0,

  -- Phase completion timestamps (null = not yet completed)
  elearn_completed_at timestamptz,
  read_completed_at timestamptz,
  watch_completed_at timestamptz,
  practise_completed_at timestamptz,

  -- Topic-level completion
  completed_at timestamptz,

  -- Slide visit tracking (array of visited slide indices for the e-learning phase)
  visited_slides integer[] default '{}',

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- One row per user per topic
  constraint topic_progress_unique unique (user_id, level, topic_id)
);

alter table topic_progress enable row level security;

create policy "Users can read own topic progress"
  on topic_progress for select using (auth.uid() = user_id);
create policy "Users can insert own topic progress"
  on topic_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own topic progress"
  on topic_progress for update using (auth.uid() = user_id);

create index topic_progress_user_level
  on topic_progress(user_id, level);

-- 12. ACTIVITY LOG
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in (
    'slide_viewed',
    'phase_completed',
    'topic_completed',
    'level_completed',
    'tool_used',
    'artefact_saved',
    'artefact_opened',
    'reflection_submitted',
    'quiz_answered',
    'session_started'
  )),
  level integer check (level between 1 and 5),
  topic_id integer,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table activity_log enable row level security;

create policy "Users can read own activity"
  on activity_log for select using (auth.uid() = user_id);
create policy "Users can insert own activity"
  on activity_log for insert with check (auth.uid() = user_id);

create index activity_log_user_date
  on activity_log(user_id, created_at desc);
create index activity_log_user_action
  on activity_log(user_id, action);

-- 13. PROFILE COLUMNS FOR ONBOARDING & DASHBOARD
-- Run these ALTER statements if the profiles table already exists:
-- alter table profiles add column if not exists onboarding_completed boolean default false;
-- alter table profiles add column if not exists current_level integer default 1;
-- alter table profiles add column if not exists streak_days integer default 0;

-- 14. ORG_ID ON PROFILES (denormalised for fast lookups)
alter table profiles add column if not exists org_id uuid references organisations(id);

-- 15. ORG INVITES
create table if not exists org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id),
  email text,                                     -- null = open invite link
  invite_code text not null unique,               -- 8-char alphanumeric code
  role text not null default 'learner' check (role in ('learner', 'facilitator', 'admin')),
  created_by uuid references auth.users(id),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  expires_at timestamptz default (now() + interval '30 days'),
  created_at timestamptz default now()
);

alter table org_invites enable row level security;

-- Admins can manage invites for their org
create policy "Org admins can manage invites" on org_invites
  for all using (
    org_id in (
      select p.org_id from profiles p
      where p.id = auth.uid() and p.org_id is not null
      and exists (
        select 1 from user_org_memberships om
        where om.user_id = auth.uid() and om.org_id = p.org_id and om.role = 'admin' and om.active = true
      )
    )
  );
-- Anyone can read an invite by code (for the join flow)
create policy "Anyone can read invite by code" on org_invites
  for select using (true);

-- 16. EXPANDED RLS — org-scoped reads
-- IMPORTANT: Never query `profiles` from within a `profiles` policy — causes infinite recursion.
-- Use user_org_memberships or SECURITY DEFINER functions instead.

-- Helper function to check platform admin status without triggering profiles RLS
create or replace function is_oxygy_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid()
    and platform_role in ('oxygy_admin', 'super_admin')
  );
end;
$$;

-- Helper function to get user's org IDs without triggering RLS recursion on user_org_memberships
create or replace function get_user_org_ids()
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select org_id from user_org_memberships
    where user_id = auth.uid() and active = true;
end;
$$;

-- Allow org members to read profiles of colleagues (via memberships, not profiles self-reference)
create policy "Org members can read org profiles" on profiles
  for select using (
    org_id is not null
    and org_id in (
      select om.org_id from user_org_memberships om
      where om.user_id = auth.uid() and om.active = true
    )
  );

-- Allow oxygy/super admins to read all profiles (uses SECURITY DEFINER function)
create policy "Oxygy admins can read all profiles" on profiles
  for select using (is_oxygy_admin());

-- Allow client admins to read profiles in their org
create policy "Client admins can read org profiles" on profiles
  for select using (
    exists (
      select 1
      from user_org_memberships admin_m
      join user_org_memberships user_m on user_m.org_id = admin_m.org_id
      where admin_m.user_id = auth.uid()
        and admin_m.role = 'admin'
        and user_m.user_id = profiles.id
    )
  );

-- Allow org members to read activity for colleagues in the same org
create policy "Org members can read org activity" on activity_log
  for select using (
    user_id in (
      select id from profiles
      where org_id is not null
        and org_id = (select org_id from profiles where id = auth.uid())
    )
  );

-- Allow org members to read org topic progress
create policy "Org members can read org topic progress" on topic_progress
  for select using (
    user_id in (
      select id from profiles
      where org_id is not null
        and org_id = (select org_id from profiles where id = auth.uid())
    )
  );

-- Allow org members to insert their own memberships (join flow)
create policy "Users can insert own memberships" on user_org_memberships
  for insert with check (auth.uid() = user_id);

-- Allow platform admins and org admins to insert memberships for other users (scan-enroll, invite)
-- Uses get_user_org_ids() SECURITY DEFINER helper to avoid RLS recursion
create policy "Admins can insert memberships" on user_org_memberships
  for insert with check (
    is_oxygy_admin()
    OR org_id in (select get_user_org_ids())
  );

-- Allow any active org member to read all memberships in their org (needed for leaderboard)
-- Uses get_user_org_ids() SECURITY DEFINER helper to avoid RLS recursion
create policy "Org members can read org memberships" on user_org_memberships
  for select using (
    org_id in (select get_user_org_ids())
  );

-- Allow org admins to update memberships in their org
create policy "Org admins can update memberships" on user_org_memberships
  for update using (
    is_oxygy_admin()
    OR org_id in (select get_user_org_ids())
  );

-- Allow org admins to delete memberships in their org
create policy "Org admins can delete memberships" on user_org_memberships
  for delete using (
    is_oxygy_admin()
    OR org_id in (select get_user_org_ids())
  );

-- Allow org admins to manage workshop sessions
create policy "Org admins can manage sessions" on workshop_sessions
  for all using (
    org_id in (
      select p.org_id from profiles p
      where p.id = auth.uid() and p.org_id is not null
      and exists (
        select 1 from user_org_memberships om
        where om.user_id = auth.uid() and om.org_id = p.org_id and om.role = 'admin' and om.active = true
      )
    )
  );

-- Ensure organisations table has RLS + read policy
alter table organisations enable row level security;
create policy "Authenticated users can read orgs" on organisations
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- PRD-10: Auth & Multi-Tenancy Foundation
-- ============================================================

-- 17. PLATFORM ROLE ON PROFILES
alter table profiles add column if not exists platform_role text default 'learner';

-- 18. ORGANISATION PROGRAMME CONFIGURATION
alter table organisations add column if not exists level_access jsonb default '[1, 2, 3, 4, 5]'::jsonb;
alter table organisations add column if not exists branding jsonb default '{}'::jsonb;
alter table organisations add column if not exists max_users integer;
alter table organisations add column if not exists contact_email text;
alter table organisations add column if not exists contact_name text;

-- 19. COHORTS
create table if not exists cohorts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  name text not null, description text,
  start_date date, end_date date,
  active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table cohorts enable row level security;
create index if not exists idx_cohorts_org_id on cohorts(org_id);

-- 20. ENROLLMENT CHANNELS
create table if not exists enrollment_channels (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  cohort_id uuid references cohorts(id) on delete set null,
  type text not null check (type in ('link', 'code', 'domain')),
  value text not null,
  label text, max_uses integer, uses_count integer default 0,
  expires_at timestamptz, active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  auto_enroll boolean default true,
  constraint uq_enrollment_channel_value unique (value)
);
alter table enrollment_channels enable row level security;
create index if not exists idx_enrollment_channels_org_id on enrollment_channels(org_id);
create index if not exists idx_enrollment_channels_value on enrollment_channels(value);

-- 21. USER_ORG_MEMBERSHIPS — cohort + enrollment tracking
alter table user_org_memberships add column if not exists cohort_id uuid references cohorts(id);
alter table user_org_memberships add column if not exists enrolled_via uuid references enrollment_channels(id);

-- 22. AUDIT LOG (admin actions)
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id),
  action text not null, target_type text, target_id uuid,
  org_id uuid references organisations(id),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
alter table audit_log enable row level security;
create index if not exists idx_audit_log_actor on audit_log(actor_id);
create index if not exists idx_audit_log_org on audit_log(org_id);
create index if not exists idx_audit_log_created on audit_log(created_at desc);

-- 23. FEATURE FLAGS (PRD-15)
create table if not exists feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  description text,
  org_id uuid references organisations(id),
  enabled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_feature_flag unique (key, org_id)
);
alter table feature_flags enable row level security;

-- 24. PRD-10 RLS POLICIES (see migration-010-auth-multitenancy.sql for full idempotent version)
