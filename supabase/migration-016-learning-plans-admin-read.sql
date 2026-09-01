-- Migration 016: Org-scoped + admin read access on learning_plans
--
-- Background: learning_plans only had an owner-read policy ("Users can read
-- own plans", auth.uid() = user_id). This blocks the new admin/demo page
-- ("Assessment Results -> Learning Plan") from viewing other users' plans:
-- Supabase RLS returns zero rows silently (no error) for a query that isn't
-- permitted, so without this migration the page will render as empty for
-- every user except the one currently logged in.
--
-- Mirrors the existing pattern already used for topic_progress / activity_log
-- (org-scoped via profiles.org_id) and profiles (is_oxygy_admin()).
--
-- Also adds why_this_plan: the AI-generated "why this plan" sentence was
-- previously only held in memory during onboarding and never persisted, so
-- getLatestLearningPlan() could never return it after the fact.

alter table learning_plans add column if not exists why_this_plan text;

create policy "Org members can read org learning plans" on learning_plans
  for select using (
    user_id in (
      select id from profiles
      where org_id is not null
        and org_id = (select org_id from profiles where id = auth.uid())
    )
  );

create policy "Oxygy admins can read all learning plans" on learning_plans
  for select using (is_oxygy_admin());
