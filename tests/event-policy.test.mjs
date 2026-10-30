import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path)=>readFileSync(path,"utf8");
test("optional gathering deadlines are additive and keep legacy behavior",()=>{
 const schema=read("staff-web/prisma/schema.prisma");
 assert.match(schema,/rsvpDeadlineAt DateTime\?/);
 assert.match(schema,/cancellationDeadlineAt DateTime\?/);
 assert.match(schema,/cancellationTerms String\?/);
 const migration=read("staff-web/prisma/migrations/20261030233000_event_reservation_policy/migration.sql");
 assert.match(migration,/ADD COLUMN "rsvpDeadlineAt" TIMESTAMP\(3\)/);
 assert.doesNotMatch(migration,/DROP COLUMN|DELETE FROM|UPDATE "Event"/i);
});
test("published policy is enforced by authoritative server writes",()=>{
 const create=read("staff-web/src/app/api/v1/admin/route.ts");
 const rsvp=read("staff-web/src/app/api/v1/actions/route.ts");
 const cancel=read("staff-web/src/app/api/v1/events/rsvp/route.ts");
 const mobile=read("masjid-mobile/app/details/[kind]/[id].tsx");
 assert.match(create,/INVALID_DEADLINE/);
 assert.match(rsvp,/RSVP_CLOSED/);
 assert.match(rsvp,/rsvpDeadlineAt:\{gt:new Date\(\)\}/);
 assert.match(cancel,/CANCELLATION_CLOSED/);
 assert.match(mobile,/cancellationClosed/);
 assert.match(mobile,/reservationClosed/);
 assert.match(read("staff-web/scripts/test-gather.mjs"),/lateCancel/);
});
