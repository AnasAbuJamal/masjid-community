import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("analytics is independently opted-in per mosque and revocable",()=>{
 const db=read("staff-web/prisma/schema.prisma"),api=read("staff-web/src/app/api/v1/me/analytics-consent/route.ts");
 for(const text of [
  "model OrganizationAnalyticsConsent {",
  "@@unique([organizationId,userId])",
  "enabled Boolean @default(false)"
 ])assert.ok(db.includes(text),text);
 for(const text of [
  "requireMemberContext(req)","STUDENT_ANALYTICS_DISABLED",
  "z.literal(true)",'consentedAt:input.enabled?now:null',
  '"analytics.consent.change"','Prisma.TransactionIsolationLevel.Serializable'
 ])assert.ok(api.includes(text),text);
 assert.ok(!api.includes("organizationDeliveryPreference"));
 assert.ok(read("masjid-mobile/app/settings.tsx").includes('useResource<AnalyticsConsentData>("me/analytics-consent")'));
 assert.ok(read("staff-web/src/app/api/v1/account/export/route.ts").includes("analyticsConsent:"));
});
test("admin metrics have only consented coarse group-bands and no private rows",()=>{
 const api=read("staff-web/src/app/api/v1/admin/analytics/route.ts");
 for(const text of [
  'requireVerified(req,["admin"])',
  'organizationId:org.id,status:"published",endAt:{lt:new Date()}',
  'user:allowedUsers','analyticsConsents:{some:{organizationId:org.id,enabled:true,consentedAt:{not:null}}}',
  "groupBy({by:[\"eventId\"]", "const MIN_GROUP=10",
  'if(!confirmedBand)return []','confirmedBand,arrivedBand:band('
 ])assert.ok(api.includes(text),text);
 assert.ok(!api.includes("eventRSVP.findMany("));
 assert.ok(!api.includes("userId:true"));
 const ui=read("staff-web/src/app/admin/analytics/page.tsx");
 assert.ok(ui.includes("Suppressed"));
 assert.ok(ui.includes("confirmedBand"));
 const smoke=read("staff-web/scripts/test-analytics-consent.mjs");
 assert.ok(smoke.includes("nine opted-in participants are suppressed"));
 assert.ok(read(".github/workflows/verify.yml").includes("test-analytics-consent.mjs"));
});

test("CI verifies two-mosque consent isolation and current role and membership eligibility",()=>{
 const test=read("staff-web/scripts/test-analytics-consent.mjs");
 for(const token of [
  'role:"student"','data:{status:"suspended"}',
  'student-role account cannot be counted','suspended membership cannot still count',
  'foreignSelected','otherOptIn','restoredHome','secondaryOff',
  'opt-in at the primary mosque does not opt in the secondary mosque',
  'home consent withdrawal does not silently revoke separate mosque consent'
 ])assert.ok(test.includes(token),"Missing tenant/role consent regression: "+token);
});
