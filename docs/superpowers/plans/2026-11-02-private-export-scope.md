# Private export scope implementation plan

**Goal:** F-043/F-048: only the account and mosque that confirmed a private export may open its native sharing sheet.

**Architecture:** Keep existing server reauthentication and authorization. Add a dependency-free native export controller using the existing scoped action gate, then wire it into Settings. Confirmation captures a context generation, not credentials. Validate response organization, owner email and bounded-export metadata before sharing. Scope changes/unmount invalidate confirmations and pending results and clear the password field. Sharing already handed to the OS cannot be recalled.

**Spec:** `document.md`, F-043 privacy export and F-048 tenant-safe state separation; existing explicit consent and password reauthentication requirements.

**Global constraints:** No deployment, real records, provider operations or database migrations. Preserve English/Arabic feedback. API remains authoritative; client guards do not revoke already delivered requests.

**Review focus:** stale confirmation before dispatch; context change during a delayed response; duplicate taps; mismatched/malformed receipts; late errors or cleanup after a newer operation. Each is covered by controller runtime tests and Settings wiring checks.

## Task 1: Scope private export sharing

- [ ] Write failing runtime tests in `tests/mobile-private-export-scope.test.mjs` for same-scope success, stale confirmations, account/mosque switch, unmount, duplicate requests, invalid receipt identity/metadata and stale failure cleanup.
- [ ] Implement `createPrivateExportAction()` in `masjid-mobile/src/private-export.ts`: `bind(scope)`, `invalidate()`, `capture()`, `isCurrent(intent)` and `run(intent, expected, request, share)`. Return `shared`, `discarded` or `busy`; never share an unverified receipt.
- [ ] Integrate Settings confirmation with captured intent and selected organization/owner, clear password on scope invalidation and dispatch, and suppress stale notices/errors/cleanup. Reuse bilingual export failure copy.
- [ ] Run focused tests, all root tests, both TypeScript checks and Expo compatibility; run Prisma validation/web build where dependencies are available. Inspect exact GitHub CI after publishing the patch.
- [ ] Update `IMPLEMENTATION_STATUS.md` with actual evidence and remaining native/privacy acceptance; commit and publish a reviewable patch targeting development.

Execution decision: continue the user-authorized incremental implementation directly in the existing Expo/TypeScript stack. No new platform or product-policy choices are needed.
