# ADR 002 — Safe limited session-based organization context

Status: **Implemented as a defensive pilot on `development`; not suitable
for unrestricted multi-organization production use.**

## Problem
A single person can belong to multiple mosques, but existing
`User.role` is global, and legacy APIs resolve the first organization.
Adding an unrestricted mosque selector would allow a newly selected
member session to read or modify private information in the wrong
organization.

## Decision
Add `AuthSession.selectedOrganizationId` (nullable for legacy home
selection) and an authenticated membership selector. Store context
server-side in the current session, never trust a browser header or
unverified resource ID. Enforce active membership and verified identity
on each migrated private request. Migrate only the member dashboard,
private inbox, mark-read, optional email choices, and associated
privacy-status reads first.

All other `requireVerified` endpoints explicitly reject non-home
selection with `TENANT_CONTEXT_UNSUPPORTED`; invitation preview
has the same guard even though it cannot require a verified account
at the preview step. Block global privileged role holders from
selecting any other mosque until roles are membership-bound.
Keep ordinary account identity/security controls global. Change
mobile resource-cache generation on selection so stale in-flight
responses cannot display previously selected mosque content.

## Alternatives declined and tradeoffs
- A user-chosen `X-Organization-Id`/URL override is not authority.
- Automatically inferring the tenant from a first active membership
  is ambiguous and unsafe for multi-mosque identities.
- Repurposing `User.role` as a per-mosque role falsely transfers
  staff/finance powers; a separate membership role design is needed.
- Migrating all ~60 API routes in one sweep risks cross-tenant leaks;
  a fail-closed pilot keeps unsupported private workflows unavailable.
- Legacy account profile/device sessions are account-wide; scoped
  privacy-request status must never fall back to another mosque.
- This does not solve multi-venue public discovery or organization-
  specific staff/admin/financial identity and provider ownership.

## Test and follow-up
CI seeds a second organization, shared identity, private donations,
events/RSVPs, messages and consent settings. It verifies per-session
selection, active membership revocation, member-versus-staff policy,
cross-mosque data denial and endpoint fallback blocking.
Next: role per membership, all-route migration, dedicated steward
workflow, scoped API clients, comprehensive negative tests, audited
rollout gates and qualified review.
