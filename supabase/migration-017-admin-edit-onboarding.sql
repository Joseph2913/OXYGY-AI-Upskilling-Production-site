-- Migration 017: Admin write access for editing another user's onboarding
-- answers and regenerating their learning plan (demo tooling on
-- /app/my-plan). Without this, an admin's edit + regenerate action fails
-- silently: RLS returns 0 rows affected on the profiles UPDATE and rejects
-- the learning_plans INSERT (its insert policy requires auth.uid() = user_id),
-- with no error surfaced to the client.
--
-- Mirrors the existing read-policy pattern (is_oxygy_admin() for platform
-- admins, the admin_m/user_m org-membership join for client/org admins).

create policy "Oxygy admins can update any profile" on profiles
  for update using (is_oxygy_admin());

create policy "Client admins can update org profiles" on profiles
  for update using (
    exists (
      select 1
      from user_org_memberships admin_m
      join user_org_memberships user_m on user_m.org_id = admin_m.org_id
      where admin_m.user_id = auth.uid()
        and admin_m.role = 'admin'
        and user_m.user_id = profiles.id
    )
  );

create policy "Oxygy admins can insert any learning plan" on learning_plans
  for insert with check (is_oxygy_admin());

create policy "Client admins can insert org learning plans" on learning_plans
  for insert with check (
    exists (
      select 1
      from user_org_memberships admin_m
      join user_org_memberships user_m on user_m.org_id = admin_m.org_id
      where admin_m.user_id = auth.uid()
        and admin_m.role = 'admin'
        and user_m.user_id = learning_plans.user_id
    )
  );
