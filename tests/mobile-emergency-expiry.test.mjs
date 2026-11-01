import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 emergencyExpiry,isCurrentVenueEmergency,emergencyRecheckDelay
} from "../masjid-mobile/src/emergency-expiry.ts";

test("a published notice is only current strictly before its exact UTC expiration",()=>{
 const expires="2026-11-01T20:00:00.000Z";
 const deadline=Date.parse(expires);
 assert.equal(emergencyExpiry(expires),deadline);
 assert.equal(isCurrentVenueEmergency(expires,deadline-1),true);
 assert.equal(isCurrentVenueEmergency(expires,deadline),false);
 assert.equal(isCurrentVenueEmergency(expires,deadline+1),false);
 assert.equal(emergencyRecheckDelay(expires,deadline-5),6);
 assert.equal(emergencyRecheckDelay(expires,deadline),null);
});

test("incorrect, ambiguous, normalized or missing expiry data never authorizes a safety notice",()=>{
 for(const expiresAt of [
  null,undefined,"",123,{},[],"tomorrow","2026-11-01","2026-11-01T20:00:00Z",
  "2026-11-01T20:00:00.000+00:00","2026-02-30T20:00:00.000Z",
  "2026-13-01T20:00:00.000Z","2026-11-01T25:00:00.000Z",
  "2026-11-01T20:00:00.000Zmalicious"
 ]){
  assert.equal(emergencyExpiry(expiresAt),null,String(expiresAt));
  assert.equal(isCurrentVenueEmergency(expiresAt,0),false,String(expiresAt));
  assert.equal(emergencyRecheckDelay(expiresAt,0),null,String(expiresAt));
 }
 assert.equal(isCurrentVenueEmergency("2026-11-01T20:00:00.000Z",NaN),false);
 assert.equal(emergencyRecheckDelay("2026-11-01T20:00:00.000Z",Infinity),null);
});

test("long-running app reviews status within one minute and at exact expiration",()=>{
 const deadline=Date.parse("2026-11-01T20:00:00.000Z");
 assert.equal(emergencyRecheckDelay("2026-11-01T20:00:00.000Z",deadline-10_000),10_001);
 assert.equal(emergencyRecheckDelay("2026-11-01T20:00:00.000Z",deadline-86_400_000),60_000);
});

test("shared English/Arabic emergency alert rechecks on expiration and app foreground",()=>{
 const component=readFileSync("masjid-mobile/src/VenueEmergencyAlert.tsx","utf8");
 const locales=readFileSync("masjid-mobile/src/i18n.tsx","utf8");
 assert.match(component,/isCurrentVenueEmergency\(notice\.expiresAt/);
 assert.match(component,/emergencyRecheckDelay\(notice\.expiresAt/);
 assert.match(component,/AppState\.addEventListener\("change"/);
 assert.match(component,/state==="active"/);
 assert.match(component,/clearTimeout\(timer\)/);
 assert.match(component,/t\("emergency\.unverified"\)/);
 assert.match(component,/accessibilityRole="alert"/);
 assert.match(component,/onPress=\{onRefresh\}/);
 assert.match(locales,/"emergency\.unverified":\{en:".+",ar:".+"\}/);
});
