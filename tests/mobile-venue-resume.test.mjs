import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {shouldRefreshVenueOnResume} from "../masjid-mobile/src/venue-resume-policy.ts";

test("venue publication is refetched after actual iOS/Android background return",()=>{
 assert.equal(shouldRefreshVenueOnResume("background","active"),true);
 assert.equal(shouldRefreshVenueOnResume("inactive","active"),true);
 for(const before of ["active","unknown",null,undefined]){
  assert.equal(shouldRefreshVenueOnResume(before,"active"),false,String(before));
 }
 for(const next of ["inactive","background","unknown"]){
  assert.equal(shouldRefreshVenueOnResume("background",next),false,next);
 }
});

test("both Today and Salah use shared foreground revalidation and 60-second polling",()=>{
 const hook=readFileSync("masjid-mobile/src/useVenueSafetyRefresh.ts","utf8");
 assert.match(hook,/AppState\.addEventListener\("change"/);
 assert.match(hook,/shouldRefreshVenueOnResume\(previous,state\)/);
 assert.match(hook,/setInterval\(\(\)=>void refresh\(\),60_000\)/);
 assert.match(hook,/clearInterval\(timer\)/);
 assert.match(hook,/subscription\.remove\(\)/);
 for(const file of [
  "masjid-mobile/app/(tabs)/index.tsx",
  "masjid-mobile/app/(tabs)/salah.tsx"
 ]){
  const screen=readFileSync(file,"utf8");
  assert.match(screen,/useVenueSafetyRefresh\(!!path,refresh\)/,file);
  assert.doesNotMatch(screen,/setInterval\(\(\)=>void refresh\(\),60_000\)/,
   "Do not duplicate the shared polling timer in "+file);
 }
});
