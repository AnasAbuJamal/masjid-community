import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("kiosk binds public venue/day/prayer/alert versions to its safety wrapper",()=>{
 const kiosk=readFileSync("staff-web/src/app/kiosk/page.tsx","utf8");
 const refresh=readFileSync("staff-web/src/app/kiosk/KioskRefresh.tsx","utf8");
 assert.match(kiosk,/<KioskRefresh snapshot=\{\{/);
 assert.match(kiosk,/currentVenueEmergency\(venue\?\.id,now\)/);
 assert.match(kiosk,/prayerUpdatedAt:prayer\?\.updatedAt\.toISOString\(\)/);
 assert.match(kiosk,/emergencyRevision:emergency\?\.revision/);
 assert.match(kiosk,/searchParams:Promise<\{venueId\?:string\|string\[\]\}>/);
 assert.match(kiosk,/if\(params\.venueId!==undefined&&!venueId\)notFound\(\)/);
 assert.match(kiosk,/where:\{organizationId:org\.id,\.\.\.\(venueId\?/);
 assert.match(kiosk,/if\(venueId&&!venue\)notFound\(\)/);
 assert.match(readFileSync("staff-web/scripts/test-venue-emergencies.mjs","utf8"),
  /foreign organization venue must not be selectable on the public kiosk/);
 assert.match(refresh,/router\.refresh\(\)/);
 assert.match(refresh,/45_000/);
 assert.doesNotMatch(refresh,/location\.reload/);
});
test("failed or changed publication checks obscure public text before showing stale content",()=>{
 const code=readFileSync("staff-web/src/app/kiosk/KioskRefresh.tsx","utf8");
 const style=readFileSync("staff-web/src/app/globals.css","utf8");
 assert.match(code,/useState<string\|null>\("Verifying current published venue information."\)/);
 assert.match(code,/fetch\("\/api\/v1\/public\/home"\+query/);
 assert.match(code,/cache:"no-store"/);
 assert.match(code,/matchesKioskSnapshot/);
 assert.match(code,/venueCivilDay/);
 assert.match(code,/AbortController/);
 assert.match(code,/12_000/);
 assert.match(code,/setIssue\("The display cannot verify/);
 assert.match(code,/aria-hidden=\{obscured\} inert=\{obscured\}/);
 assert.match(code,/setBlanked\(true\)/);
 assert.match(code,/Verify and resume display/);
 assert.match(code,/Retry verification/);
 assert.match(code,/role="alert"/);
 assert.match(style,/\.kiosk-safety-cover\{position:fixed;inset:0;z-index:100/);
});
