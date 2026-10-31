import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("public kiosk revalidates the server's current venue alert regularly",()=>{
 const kiosk=readFileSync("staff-web/src/app/kiosk/page.tsx","utf8");
 const refresh=readFileSync("staff-web/src/app/kiosk/KioskRefresh.tsx","utf8");
 assert.match(kiosk,/<KioskRefresh\/>/);
 assert.match(kiosk,/currentVenueEmergency\(venue\?\.id\)/);
 assert.match(refresh,/router\.refresh\(\)/);
 assert.match(refresh,/45_000/);
 assert.doesNotMatch(refresh,/location\.reload/);
});
