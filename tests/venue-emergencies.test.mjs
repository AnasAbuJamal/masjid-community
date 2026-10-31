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
  assert.match(source,/accessibilityRole="alert"/);
  assert.match(source,/instructions/);
 }
 assert.match(read(".github/workflows/verify.yml"),/scripts\/test-venue-emergencies\.mjs/);
});
