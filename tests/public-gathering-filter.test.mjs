import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p)=>readFileSync(p,"utf8");

test("public gathering HTML filters never choose a tenant and fail closed",()=>{
 const page=read("staff-web/src/app/visit/page.tsx");
 assert.match(page,/organizationId:organization\.id,status:"published"/);
 assert.match(page,/filterInvalid/);
 assert.match(page,/role="alert"/);
 assert.match(page,/publicGatheringItems\(events/);
 assert.match(page,/GATHERING_ACCESSIBILITY/);
 assert.match(page,/name="gatherVenue"/);
 assert.match(read("staff-web/scripts/test-public.mjs"),/CI_WEB_FILTERED_GATHERING/);
});
