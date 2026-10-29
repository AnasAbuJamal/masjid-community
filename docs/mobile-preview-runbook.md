# SILA: private Android + iPhone previews

The Expo app can build Android APK and iPhone ad hoc IPA previews. The build
profiles do not publish to app stores, deploy the backend, or authorize real
student/guardian or payment data. The SILA name is provisional. There is
currently no verified phone installation link.

## Required staging and approval gates

1. Use the sole Git branch, development. The exact commit must pass all three
   jobs of the existing Verify rebuilt apps GitHub Actions workflow.
2. Provision an isolated, access-controlled staging PostgreSQL and backend
   with real private server-side secrets and an HTTPS origin. Review migrations,
   rehearse backup/restore and confirm the public /api/health response reports
   reachable database. Never apply the empty-database baseline to live data.
3. Validate member, guardian and teacher access-denial tests, prayer publication,
   synthetic records, and safeguarding officer approval. Do not expose private
   children, real financial accounts or care records in testing.
4. Link the Expo project to an approved Expo account. Register the iPhone
   devices and configure an authorized paid Apple Developer account, ad hoc
   provisioning and valid signing credentials.

## Initial Expo setup (interactive, performed by authorized owner)

From the development branch checkout:

    cd masjid-mobile
    npx eas-cli@latest login
    npx eas-cli@latest init
    npx eas-cli@latest build:configure --platform all

Inspect and commit the generated nonsecret EAS project ID under
expo.extra.eas.projectId in masjid-mobile/app.json to development. Do not
commit tokens, certificates, keystores or account passwords.

Set EXPO_PUBLIC_API_URL in the EAS preview environment to the approved
staging HTTPS origin. It is compiled into the phone binary and must never
contain a password or API secret. The preview app.config.js rejects missing
and non-HTTPS values. Verify the staging API is healthy before building.

For the **first** Android build, run interactively and set up EAS-managed
keystore signing:

    npx eas-cli@latest build --platform android --profile preview

For iPhone, register physical tester devices and set up ad hoc provisioning
interactively with the authorized Apple Developer account:

    npx eas-cli@latest device:create
    npx eas-cli@latest build --platform ios --profile preview

A newly added iPhone device requires rebuilding or re-signing with an
updated provisioning profile; iPhone apps cannot be freely installed like
Android APKs.

## Manual GitHub Actions after the first signed builds succeed

Configure repository **secret** EXPO_TOKEN for the approved Expo project.
Configure repository **variables** SILA_MOBILE_PREVIEW_API_URL (same HTTPS
origin as the EAS preview environment) and
SILA_MOBILE_PREVIEW_APPROVED=true only after the designated release owner
approves private synthetic-only testing.

Visit Actions / Internal phone previews (manual, safeguarded) / Run workflow
on development. Enter the **exact** 40-character current commit SHA, choose
both, and attest the private-testing review. The workflow refuses a mismatched
SHA, missing approval/Expo project/token, missing passing verification run
or unreachable staging database. It creates Android and iPhone internal
preview binaries only, waits for EAS results, and never submits them to
public stores.

Find the **actual** EAS build detail URLs in the successful run; share only
the installation links for the exact verified builds with authorized testers.
Protect internal builds with Expo account authentication. Apple ad hoc links
only install on devices included in the provisioning profile.

## Blockers at last verified review (2026-10-29)

- The app.json Expo EAS projectId is absent; build credentials and paid
  Apple registration are not verified.
- Linked Vercel project masjid-community has no environment variables,
  including DATABASE_URL. There is no verified staging API for phone use.
- Staging backup/restore, safeguarding/release approval, iOS device
  registration and signed first builds remain unverified.

See the deployment-runbook.md for backend and production gates. No live
data migration, production deployment or app-store publication is approved.
