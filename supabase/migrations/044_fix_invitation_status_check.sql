-- Fix: add 'declined' to the workspace_invitations status CHECK constraint.
-- The respond-invitation API sets status='declined' but the original CHECK only
-- allowed: pending, accepted, expired, cancelled.

ALTER TABLE workspace_invitations
  DROP CONSTRAINT IF EXISTS workspace_invitations_status_check;

ALTER TABLE workspace_invitations
  ADD CONSTRAINT workspace_invitations_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled'));
