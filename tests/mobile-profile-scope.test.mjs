import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {allowPilotContent,memberSurfaceScope} from "../masjid-mobile/src/searchScope.ts";

test("unsupported second-mosque profile actions never use pilot authorization",()=>{
 const context={selectedOrganizationId:"second",selectedActive:true,organizations:[
  {id:"first",memberWorkspace:"pilot"},
  {id:"second",memberWorkspace:"limited_member_worship_gather"}
 ]};
 assert.equal(allowPilotContent(memberSurfaceScope(context,true)),false);
 assert.equal(allowPilotContent(memberSurfaceScope({...context,selectedOrganizationId:"first"},true)),true);
});
test("You screen distinguishes foreign commitments from unsupported actions",()=>{
 const src=readFileSync("masjid-mobile/app/(tabs)/profile.tsx","utf8");
 assert.match(src,/const pilotAllowed=surface\.allowed/);
 assert.match(src,/service_shift"&&!pilotAllowed/);
 assert.match(src,/Shift detail actions are not available/);
 assert.match(src,/d\.receipt&&pilotAllowed/);
 assert.match(src,/pilotAllowed\?<PressRow icon="school-outline"/);
 assert.match(src,/pilotAllowed\?<PressRow icon="heart-outline"/);
 assert.match(src,/upcomingWhen\(r\.event\.startAt\)/);
});
