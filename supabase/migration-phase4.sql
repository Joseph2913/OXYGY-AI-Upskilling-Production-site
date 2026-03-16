-- ============================================================
-- Phase 4 Migration — Run this in Supabase SQL Editor
-- Only new tables, columns, and policies (safe to run on existing DB)
-- ============================================================

-- 1. Add org_id to profiles (denormalised for fast lookups)
alter table profiles add column if not exists org_id uuid references organisations(id);

-- 2. Create org_invites table
create table if not exists org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id),
  email text,
  invite_code text not null unique,
  role text not null default 'learner' check (role in ('learner', 'facilitator', 'admin')),
  created_by uuid references auth.users(id),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  expires_at timestamptz default (now() + interval '30 days'),
  created_at timestamptz default now()
);

alter table org_invites enable row level security;

-- 3. RLS for org_invites
create policy "Org admins can manage invites" on org_invites
  for all using (
    org_id in (
      select org_id from user_org_memberships
      where user_id = auth.uid() and role = 'admin' and active = true
    )
  );

create policy "Anyone can read invite by code" on org_invites
  for select using (true);

-- 4. Expanded RLS — org-scoped reads for activity_log
create policy "Org members can read org activity" on activity_log
  for select using (
    user_id in (
      select m2.user_id from user_org_memberships m1
      join user_org_memberships m2 on m1.org_id = m2.org_id
      where m1.user_id = auth.uid() and m1.active = true and m2.active = true
    )
  );

-- 5. Expanded RLS — org-scoped reads for profiles
create policy "Org members can read org profiles" on profiles
  for select using (
    id in (
      select m2.user_id from user_org_memberships m1
      join user_org_memberships m2 on m1.org_id = m2.org_id
      where m1.user_id = auth.uid() and m1.active = true and m2.active = true
    )
  );

-- 6. Expanded RLS — org-scoped reads for topic_progress
create policy "Org members can read org topic progress" on topic_progress
  for select using (
    user_id in (
      select m2.user_id from user_org_memberships m1
      join user_org_memberships m2 on m1.org_id = m2.org_id
      where m1.user_id = auth.uid() and m1.active = true and m2.active = true
    )
  );

-- 7. Allow users to insert their own org memberships (for join flow)
create policy "Users can insert own memberships" on user_org_memberships
  for insert with check (auth.uid() = user_id);

-- 8. Allow org admins to manage all memberships in their org
create policy "Org admins can manage memberships" on user_org_memberships
  for all using (
    org_id in (
      select org_id from user_org_memberships
      where user_id = auth.uid() and role = 'admin' and active = true
    )
  );

-- 9. Allow org admins to manage workshop sessions
create policy "Org admins can manage sessions" on workshop_sessions
  for all using (
    org_id in (
      select org_id from user_org_memberships
      where user_id = auth.uid() and role = 'admin' and active = true
    )
  );
