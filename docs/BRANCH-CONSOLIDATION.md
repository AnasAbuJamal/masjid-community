# Branch consolidation review — 2026-10-26

## Branches inspected

- `development`: original staff/web/mobile app plus original white–blue glass UI and improved Salah staff editing feedback (head before consolidation: `9544c840`).
- `fix/security-functionality-apple-ui-20261026`: security and functionality overhaul including server-verified identity, live prayer data, admin/mobile flows, school billing/resources, and responsive testing (head before consolidation: `d5e3fd6`). This is the **working-tree foundation** because the last GitHub verification workflow for it passed.
- `codex/completion-and-database-readiness`: isolated school authorization, development infrastructure, and more extensive route and feature audits (head before consolidation: `faa4fd3`). Its own CI also passed, but it diverged in schema and endpoint implementations.

## Integration decisions

1. **Keep** the security/functionality working tree including email verification, real backend services, school invoices, resources, financial budgets, Qibla and prayer API access. Keep its current Prisma schema, migrations and operational safeguards together.
2. **Merge selectively** the original sky-blue translucent glass CSS, card/button/nav styles, mobile glass-button palette and staff prayer editor error handling from `development`. Preserve the security branch's larger touch targets, live mobile prayer data and dark-theme accessibility.
3. **Add** the local PostgreSQL Compose setup and mobile example environment settings from the readiness branch. New root README documents how to run and test the selected working tree.
4. **Preserve ancestry** of all three branches in a multi-parent merge commit so none of their history is lost. This does **not** mean every conflicting implementation was copied into the final files.

## Not blindly transplanted

The readiness branch contains school-account relationships, migrations, scoped attendance, family views and services that **conflict with or depend on a different schema** from the security branch. Adding those source files on top of the other schema without adapting and testing the full dependency chain could expose another family's data, break reporting or fail migrations. The corresponding commits remain available through Git history for careful follow-up work. The security branch's corresponding school features remain the active implementation.

The other branch also contains historical audit checklists and a separate CI workflow; duplicate workflows and older migration files have not been added to the final working tree because they could conflict.

## Verification and release limits

- Source comparison covered all three branch trees.
- Previously passing automated verification on the security branch does **not** automatically validate this merged revision; the new `development` commit must finish its own CI.
- No staging/production database migrations, secret rotation, real Stripe/email/push integration tests, full device usability tests, or Vercel production deployment were performed during branch consolidation.
- The historical security audit marks the project **not ready for production**. Consult `SECURITY_AND_RELEASE_AUDIT.md` and resolve its blockers before release.

Deleting old branch refs is a separate repository maintenance action; preserve them until the consolidated working tree passes verification. Their commits are included as merge parents, so they will remain recoverable afterward.
