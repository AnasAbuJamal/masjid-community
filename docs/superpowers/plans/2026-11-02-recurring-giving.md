# Explicit monthly giving lifecycle plan

**Goal:** F-027: explicit monthly USD consent, hosted checkout, private subscription management, provider-confirmed installments/receipts, failure handling and cancellation. Never silently turn one-time giving into recurring giving.

**Architecture:** Additive RecurringGift and RecurringInstallment models; isolated provider adapter; signed webhook handler with stable subscription/invoice identities, amounts, currency and monthly-price validation. Each verified payment creates an ordinary Donation and the existing balanced ledger/receipt. Duplicate invoice and event IDs never create a second receipt. Pending/failed/cancelled mandates never imply money received. Existing maker/checker refund path remains applicable to paid installments.

**Spec:** document.md F-027/F-028/F-041/F-044 and J07. Optional recurring flow remains hidden unless explicitly enabled after provider/finance acceptance. No live provider calls, deployment, remote migration or real account fixtures during implementation.

## Tasks
1. Write and run failing pure contract tests for explicit amount/interval/customer/subscription/invoice evidence and out-of-order/idempotent lifecycle handling; implement the smallest validated contract.
2. Add schema/migration, authenticated consent/checkout/list/cancel APIs and synthetic-only provider adapter. All member/campaign checks remain pilot scoped. Native UI shows exact monthly amount, terms and cancellation policy; data/async outcomes stay session scoped.
3. Route signed subscription/invoice events to an isolated processor, preserving payment verification, per-installment receipts, failures and terminal cancellation. Test HTTP flows against disposable CI, including replay, wrong owner/mosque/provider amount, failed-to-paid recovery, cancellation and stale events.
4. Add bilingual native giving/management screens and receipt organization authority. Integrate independently implemented account localization/shared accessibility and 50-feature acceptance audit. Run root tests, both TypeScript checks, Prisma and full exact-head CI; inspect independent review before completion claims.

## Release gates
Real Stripe test-mode mandate/cancellation/renewal/refund proof, production mapping, financial approval, native screen-reader/device QA, and all other document.md operational gates are external acceptance and remain explicitly unresolved until supplied evidence exists.
