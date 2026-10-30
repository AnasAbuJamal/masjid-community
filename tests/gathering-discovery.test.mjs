import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p)=>readFileSync(p,"utf8");

test("gathering discovery fields are optional for legacy events",()=>{
 const prisma=read("staff-web/prisma/schema.prisma");
 const migration=read("staff-web/prisma/migrations/20261030234000_gathering_discovery_metadata/migration.sql");
 assert.match(prisma,/accessibilityFeatures String\[\] @default\(\[\]\)/);
 assert.match(prisma,/venue Venue\?/);
 assert.match(migration,/ADD COLUMN "venueId" TEXT/);
 assert.match(migration,/sila_guard_event_venue_tenant_before_write/);
 assert.match(migration,/sila_block_venue_transfer_before_write/);
});

test("public and member event catalogs apply the same published filter policy",()=>{
 const helper=read("staff-web/src/lib/gathering-filters.ts");
 const selected=read("staff-web/src/app/api/v1/events/catalog/route.ts");
 const guest=read("staff-web/src/app/api/v1/public/[resource]/route.ts");
 assert.match(helper,/publishedGatheringWhere/);
 assert.match(helper,/status:"published"/);
 assert.match(helper,/accessibilityFeatures:\{has:accessibility\}/);
 assert.match(helper,/params\.getAll\(k\)\.length>1/);
 for(const file of [selected,guest]){
  assert.match(file,/gatheringFilters\(/);
  assert.match(file,/publicGatheringItems\(/);
  assert.match(file,/VENUE_NOT_FOUND/);
 }
});
