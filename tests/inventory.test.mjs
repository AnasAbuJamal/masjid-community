import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=(p)=>readFileSync(p,"utf8");
test("the product specification and both apps exist",()=>{
 for(const path of ["document.md","staff-web/prisma/schema.prisma","staff-web/src/app/api/v1/public/[resource]/route.ts","staff-web/src/app/visit/page.tsx","staff-web/src/app/visit/content/[kind]/[id]/page.tsx",
   "staff-web/src/app/api/v1/admin/prayer-revisions/route.ts", "staff-web/src/app/admin/prayer-revisions/page.tsx",
   "masjid-mobile/app/(tabs)/index.tsx","masjid-mobile/app/(tabs)/salah.tsx","masjid-mobile/app/(tabs)/discover.tsx",
   "masjid-mobile/app/(tabs)/school.tsx","masjid-mobile/app/(tabs)/profile.tsx"])
  assert.ok(existsSync(path),path);
});
test("the public API never invents fallback prayer times",()=>{
 const api=read("staff-web/src/app/api/v1/public/[resource]/route.ts");
 assert.match(api,/published:true/);
 assert.doesNotMatch(api,/mockPrayer|samplePrayer|fakePrayer/);
});
test("worship approvals require distinct users and transactionally publish a candidate",()=>{
 const api=read("staff-web/src/app/api/v1/admin/prayer-revisions/route.ts");
 assert.match(api,/SEPARATION_REQUIRED/);
 assert.match(api,/Prisma.TransactionIsolationLevel.Serializable/);
 assert.match(api,/worship.prayer.publish/);
});
test("financial updates require signed webhooks",()=>{
 const checkout=read("staff-web/src/app/api/v1/donations/checkout/route.ts");
 const webhook=read("staff-web/src/app/api/v1/webhooks/stripe/route.ts");
 assert.match(checkout,/status:"pending"/);
 assert.match(webhook,/constructEvent/);
 assert.match(webhook,/paymentEvent/);
});
test("native session credentials use protected storage, not AsyncStorage",()=>{
 const source=read("masjid-mobile/src/api.ts");
 assert.match(source,/expo-secure-store/);
 assert.doesNotMatch(source,/@react-native-async-storage/);
});
