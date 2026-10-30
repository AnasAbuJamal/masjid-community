-- Add a separately delegated, read-only audit reviewer capability.
-- Existing roles and grants remain unchanged; no automatic elevation.
ALTER TYPE "RoleCapability" ADD VALUE IF NOT EXISTS 'audit_review';
