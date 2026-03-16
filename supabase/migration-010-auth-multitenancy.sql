-- ============================================================
-- Migration 010: Auth & Multi-Tenancy Foundation
-- PRD-10 — Idempotent migration script
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── 1. ALTER profiles — add platform_role ───

alter table profiles
  add column if not exists platform_role text default 'learner';

-- Add check constraint (idempotent: drop if exists first)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_platform_role_check'
  ) then
    alter table profiles
      add constraint profiles_platform_role_check
      check (platform_role in ('learner', 'client_admin', 'oxygy_admin', 'super_admin'));
  end if;
end $$;

-- current_level and streak_days already exist in schema.sql but ensure they exist
alter table profiles
  add column if not exists current_level integer default 1;
alter table profiles
  add column if not exists streak_days integer default 0;

-- ─── 2. ALTER organisations — add programme configuration ───

alter table organisations
  add column if not exists level_access jsonb default '[1, 2, 3, 4, 5]'::jsonb;
alter table organisations
  add column if not exists branding jsonb default '{}'::jsonb;
alter table organisations
  add column if not exists max_users integer;
alter table organisations
  add column if not exists contact_email text;
alter table organisations
  add column if not exists contact_name text;

-- ─── 3. CREATE cohorts ───

create table if not exists cohorts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  name text not null,
  description text,
  start_date date,
  end_date date,
  active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_cohorts_org_id on cohorts(org_id);

-- ─── 4. CREATE enrollment_channels ───

create table if not exists enrollment_channels (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  cohort_id uuid references cohorts(id) on delete set null,
  type text not null check (type in ('link', 'code', 'domain')),
  value text not null,
  label text,
  max_uses integer,
  uses_count integer default 0,
  expires_at timestamptz,
  active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_enrollment_channel_value unique (value)
);

create index if not exists idx_enrollment_channels_org_id on enrollment_channels(org_id);
create index if not exists idx_enrollment_channels_value on enrollment_channels(value);
create index if not exists idx_enrollment_channels_type on enrollment_channels(type);

-- ─── 5. ALTER user_org_memberships — add cohort + enrollment tracking ───

alter table user_org_memberships
  add column if not exists cohort_id uuid references cohorts(id);
alter table user_org_memberships
  add column if not exists enrolled_via uuid references enrollment_channels(id);

-- ─── 6. CREATE audit_log ───

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id),
  action text not null,
  target_type text,
  target_id uuid,
  org_id uuid references organisations(id),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_audit_log_actor on audit_log(actor_id);
create index if not exists idx_audit_log_action on audit_log(action);
create index if not exists idx_audit_log_org on audit_log(org_id);
create index if not exists idx_audit_log_created on audit_log(created_at desc);

-- ─── 7. ENABLE RLS on new tables ───

alter table cohorts enable row level security;
alter table enrollment_channels enable row level security;
alter table audit_log enable row level security;

-- ─── 8. RLS POLICIES — existing tables (admin read access) ───

-- profiles: client admins can read profiles of users in their org
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Client admins can read org profiles' and tablename = 'profiles') then
    create policy "Client admins can read org profiles"
      on profiles for select
      using (
        exists (
          select 1 from user_org_memberships admin_m
          join user_org_memberships user_m on user_m.org_id = admin_m.org_id
          where admin_m.user_id = auth.uid()
            and admin_m.role = 'admin'
            and user_m.user_id = profiles.id
        )
      );
  end if;
end $$;

-- profiles: oxygy admins can read all profiles
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Oxygy admins can read all profiles' and tablename = 'profiles') then
    create policy "Oxygy admins can read all profiles"
      on profiles for select
      using (
        exists (
          select 1 from profiles p
          where p.id = auth.uid()
            and p.platform_role in ('oxygy_admin', 'super_admin')
        )
      );
  end if;
end $$;

-- level_progress: client admins can read org progress
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Client admins can read org progress' and tablename = 'level_progress') then
    create policy "Client admins can read org progress"
      on level_progress for select
      using (
        exists (
          select 1 from user_org_memberships admin_m
          join user_org_memberships user_m on user_m.org_id = admin_m.org_id
          where admin_m.user_id = auth.uid()
            and admin_m.role = 'admin'
            and user_m.user_id = level_progress.user_id
        )
      );
  end if;
end $$;

-- level_progress: oxygy admins can read all
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Oxygy admins can read all progress' and tablename = 'level_progress') then
    create policy "Oxygy admins can read all progress"
      on level_progress for select
      using (
        exists (
          select 1 from profiles p
          where p.id = auth.uid()
            and p.platform_role in ('oxygy_admin', 'super_admin')
        )
      );
  end if;
end $$;

-- saved_prompts: client admins can read org prompts
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Client admins can count org prompts' and tablename = 'saved_prompts') then
    create policy "Client admins can count org prompts"
      on saved_prompts for select
      using (
        exists (
          select 1 from user_org_memberships admin_m
          join user_org_memberships user_m on user_m.org_id = admin_m.org_id
          where admin_m.user_id = auth.uid()
            and admin_m.role = 'admin'
            and user_m.user_id = saved_prompts.user_id
        )
      );
  end if;
end $$;

-- saved_prompts: oxygy admins can read all
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Oxygy admins can read all prompts' and tablename = 'saved_prompts') then
    create policy "Oxygy admins can read all prompts"
      on saved_prompts for select
      using (
        exists (
          select 1 from profiles p
          where p.id = auth.uid()
            and p.platform_role in ('oxygy_admin', 'super_admin')
        )
      );
  end if;
end $$;

-- application_insights: client admins + oxygy admins
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Client admins can read org insights' and tablename = 'application_insights') then
    create policy "Client admins can read org insights"
      on application_insights for select
      using (
        exists (
          select 1 from user_org_memberships admin_m
          join user_org_memberships user_m on user_m.org_id = admin_m.org_id
          where admin_m.user_id = auth.uid()
            and admin_m.role = 'admin'
            and user_m.user_id = application_insights.user_id
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Oxygy admins can read all insights' and tablename = 'application_insights') then
    create policy "Oxygy admins can read all insights"
      on application_insights for select
      using (
        exists (
          select 1 from profiles p
          where p.id = auth.uid()
            and p.platform_role in ('oxygy_admin', 'super_admin')
        )
      );
  end if;
end $$;

-- organisations: oxygy admins can manage orgs (create/update/delete)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Oxygy admins can manage orgs' and tablename = 'organisations') then
    create policy "Oxygy admins can manage orgs"
      on organisations for all
      using (
        exists (
          select 1 from profiles p
          where p.id = auth.uid()
            and p.platform_role in ('oxygy_admin', 'super_admin')
        )
      );
  end if;
end $$;

-- user_org_memberships: oxygy admins can read all memberships
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Oxygy admins can read all memberships' and tablename = 'user_org_memberships') then
    create policy "Oxygy admins can read all memberships"
      on user_org_memberships for select
      using (
        exists (
          select 1 from profiles p
          where p.id = auth.uid()
            and p.platform_role in ('oxygy_admin', 'super_admin')
        )
      );
  end if;
end $$;

-- user_org_memberships: oxygy admins can manage memberships
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Oxygy admins can manage memberships' and tablename = 'user_org_memberships') then
    create policy "Oxygy admins can manage memberships"
      on user_org_memberships for all
      using (
        exists (
          select 1 from profiles p
          where p.id = auth.uid()
            and p.platform_role in ('oxygy_admin', 'super_admin')
        )
      );
  end if;
end $$;

-- workshop_sessions: oxygy admins can manage sessions
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Oxygy admins can manage sessions' and tablename = 'workshop_sessions') then
    create policy "Oxygy admins can manage sessions"
      on workshop_sessions for all
      using (
        exists (
          select 1 from profiles p
          where p.id = auth.uid()
            and p.platform_role in ('oxygy_admin', 'super_admin')
        )
      );
  end if;
end $$;

-- workshop_sessions: client admins can read org sessions
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Client admins can read org sessions' and tablename = 'workshop_sessions') then
    create policy "Client admins can read org sessions"
      on workshop_sessions for select
      using (
        exists (
          select 1 from user_org_memberships m
          where m.user_id = auth.uid()
            and m.org_id = workshop_sessions.org_id
            and m.role = 'admin'
        )
      );
  end if;
end $$;

-- ─── 9. RLS POLICIES — new tables ───

-- cohorts
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Oxygy admins can manage cohorts' and tablename = 'cohorts') then
    create policy "Oxygy admins can manage cohorts"
      on cohorts for all
      using (
        exists (
          select 1 from profiles p
          where p.id = auth.uid()
            and p.platform_role in ('oxygy_admin', 'super_admin')
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Client admins can read org cohorts' and tablename = 'cohorts') then
    create policy "Client admins can read org cohorts"
      on cohorts for select
      using (
        exists (
          select 1 from user_org_memberships m
          where m.user_id = auth.uid()
            and m.org_id = cohorts.org_id
            and m.role = 'admin'
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Learners can read own cohort' and tablename = 'cohorts') then
    create policy "Learners can read own cohort"
      on cohorts for select
      using (
        exists (
          select 1 from user_org_memberships m
          where m.user_id = auth.uid()
            and m.cohort_id = cohorts.id
        )
      );
  end if;
end $$;

-- enrollment_channels
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Oxygy admins can manage channels' and tablename = 'enrollment_channels') then
    create policy "Oxygy admins can manage channels"
      on enrollment_channels for all
      using (
        exists (
          select 1 from profiles p
          where p.id = auth.uid()
            and p.platform_role in ('oxygy_admin', 'super_admin')
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Client admins can read org channels' and tablename = 'enrollment_channels') then
    create policy "Client admins can read org channels"
      on enrollment_channels for select
      using (
        exists (
          select 1 from user_org_memberships m
          where m.user_id = auth.uid()
            and m.org_id = enrollment_channels.org_id
            and m.role = 'admin'
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Public can read active channels by value' and tablename = 'enrollment_channels') then
    create policy "Public can read active channels by value"
      on enrollment_channels for select
      using (active = true);
  end if;
end $$;

-- audit_log
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Oxygy admins can read audit log' and tablename = 'audit_log') then
    create policy "Oxygy admins can read audit log"
      on audit_log for select
      using (
        exists (
          select 1 from profiles p
          where p.id = auth.uid()
            and p.platform_role in ('oxygy_admin', 'super_admin')
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Oxygy admins can write audit log' and tablename = 'audit_log') then
    create policy "Oxygy admins can write audit log"
      on audit_log for insert
      with check (
        exists (
          select 1 from profiles p
          where p.id = auth.uid()
            and p.platform_role in ('oxygy_admin', 'super_admin')
        )
      );
  end if;
end $$;

-- ─── 10. SEED DATA — Oxygy internal org ───

insert into organisations (name, domain, tier, active, level_access)
values ('OXYGY (Internal)', 'oxygy.ai', 'catalyst', true, '[1,2,3,4,5]'::jsonb)
on conflict do nothing;

-- After Joseph signs in for the first time, run this to set his platform role:
-- update profiles set platform_role = 'super_admin'
-- where id = (select id from auth.users where email = 'joseph@oxygy.ai');

-- ============================================================
-- End of migration 010
-- ============================================================
