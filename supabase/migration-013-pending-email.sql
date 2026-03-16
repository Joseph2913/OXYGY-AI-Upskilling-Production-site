-- PRD-13: Add pending_email column to user_org_memberships for admin invites
ALTER TABLE user_org_memberships
  ADD COLUMN IF NOT EXISTS pending_email TEXT;

COMMENT ON COLUMN user_org_memberships.pending_email IS 'Email address for invited-but-not-yet-signed-up users. Set when an admin invites a user by email.';
