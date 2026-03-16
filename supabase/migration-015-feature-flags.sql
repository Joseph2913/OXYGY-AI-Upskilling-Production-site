-- PRD-15: Feature Flags table
-- Idempotent migration

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

-- Only Oxygy admins can manage feature flags
create policy "Oxygy admins can manage flags"
  on feature_flags for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.platform_role in ('oxygy_admin', 'super_admin')
    )
  );

-- All authenticated users can read flags (needed to check flags in the learner app)
create policy "Authenticated can read flags"
  on feature_flags for select
  using (auth.role() = 'authenticated');

-- Seed global flags
insert into feature_flags (key, description, enabled) values
  ('scorm_export', 'Allow SCORM package export from e-learning modules', false),
  ('ai_feedback_on_insights', 'Enable AI-generated feedback on application insights', true),
  ('cohort_leaderboard', 'Show leaderboard within cohort views', false)
on conflict do nothing;
