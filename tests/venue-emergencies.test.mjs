import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");

test("dedicated emergency notices belong only to a verified venue",()=>{
 const schema=read("staff-web/prisma/schema.prisma");
 const migration=read("staff-web/prisma/migrations/20261031002000_venue_emergency_notice/migration.sql");
 assert.match(schema,/model VenueEmergencyNotice \{/);
 assert.match(schema,/venueId String @unique/);
 assert.match(schema,/status ContentStatus @default\(draft\)/);
 assert.match(schema,/publishedById String/);
 assert.match(migration,/VenueEmergencyNotice_venueId_fkey/);
 assert.match(migration,/expiry_after_publication/);
});
test("published current notices require status, release and unexpired window",()=>{
 const helper=read("staff-web/src/lib/venue-emergencies.ts");
 assert.match(helper,/status:"published"/);
 assert.match(helper,/publishedAt:\{lte:now\}/);
 assert.match(helper,/expiresAt:\{gt:now\}/);
 assert.doesNotMatch(helper,/publishedById:true/);
 const admin=read("staff-web/src/app/api/v1/admin/venue-emergencies/route.ts");
 assert.match(admin,/requireCapability\(req,"worship_publish"\)/);
 assert.match(admin,/mfaVerified/);
 assert.match(admin,/isolationLevel:"Serializable"/);
 assert.match(admin,/expectedRevision/);
 assert.match(admin,/auditEvent\.create/);
});
test("emergency instructions are visible at each actual selected venue",()=>{
 for(const path of [
  "staff-web/src/app/api/v1/public/[resource]/route.ts",
  "staff-web/src/app/api/v1/organizations/view/route.ts",
  "staff-web/src/app/visit/page.tsx",
  "staff-web/src/app/kiosk/page.tsx"
 ]){
  assert.match(read(path),/currentVenueEmergency\(/,path);
 }
 for(const path of [
  "masjid-mobile/app/(tabs)/index.tsx",
  "masjid-mobile/app/(tabs)/salah.tsx"
 ]){
  const source=read(path);
  assert.match(source,/data\?\.emergency/);
  assert.match(source,/VenueEmergencyAlert/);
 }
 assert.match(read(".github/workflows/verify.yml"),/scripts\/test-venue-emergencies\.mjs/);
});

test("Today and Salah use the same accessible RTL-aware translated emergency chrome",()=>{
 const alert=read("masjid-mobile/src/VenueEmergencyAlert.tsx");
 const locale=read("masjid-mobile/src/i18n.tsx");
 for(const key of ["venueNotice","closure","accessChange","safety","other",
  "instructions","revision","expires","refresh"]){
  const record=locale.split('"emergency.'+key+'":')[1]?.split("\n")[0];
  assert.ok(record?.startsWith('{en:"')&&record.includes('",ar:"')&&record.trim().endsWith('},'),
   "English and Arabic labels required for "+key);
  assert.ok(alert.includes('t("emergency.'+key+'")'),"shared alert uses "+key);
 }
 for(const fragment of ['accessibilityRole="alert"',
  'const align=isRTL?"right":"left"','{notice.title}','{notice.body}',
  '{notice.instructions}','onPress={onRefresh}']){
  assert.ok(alert.includes(fragment),"emergency alert must include "+fragment);
 }
 for(const path of ["masjid-mobile/app/(tabs)/index.tsx",
  "masjid-mobile/app/(tabs)/salah.tsx"]){
  const screen=read(path);
  assert.ok(screen.includes('<VenueEmergencyAlert notice={data.emergency}'));
  assert.ok(screen.includes('onRefresh={()=>void refresh()}'));
  assert.doesNotMatch(screen,/VENUE NOTICE|What to do:/,
   "no hard-coded English emergency label outside the shared component");
 }
});
