import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {isGatheringDeadlineClosed} from "../masjid-mobile/src/gathering-deadline.ts";
import {gatheringLocalTime} from "../masjid-mobile/src/gathering-local-time.ts";

const cutoff="2026-11-01T06:30:00.000Z";
const expiry=Date.parse(cutoff);

test("RSVP and cancellation cutoffs operate on absolute instants, including DST fallback",()=>{
 assert.equal(isGatheringDeadlineClosed(cutoff,expiry-1),false);
 assert.equal(isGatheringDeadlineClosed(cutoff,expiry),true);
 assert.equal(isGatheringDeadlineClosed(cutoff,expiry+1),true);
 const before=gatheringLocalTime("2026-11-01T05:30:00.000Z","America/New_York",null,"en");
 const after=gatheringLocalTime("2026-11-01T06:30:00.000Z","America/New_York",null,"en");
 assert.ok(before&&after);
 assert.notEqual(before.text,after.text,"Repeated 1:30 AM must retain the correct timezone abbreviation");
});

test("invalid or missing RSVP cutoffs fail closed rather than enabling a reservation",()=>{
 const invalid=[undefined,null,"","tomorrow","2026-11-01",
  "2026-11-01T06:30:00Z",
  "2026-02-30T06:30:00.000Z",
  "2026-11-01T06:30:00.000+00:00",
  "2026-11-01T06:30:00.000Z<script>"];
 for(const deadline of invalid){
  assert.equal(isGatheringDeadlineClosed(deadline,0),true,String(deadline));
 }
 assert.equal(isGatheringDeadlineClosed(cutoff,NaN),true);
 assert.equal(isGatheringDeadlineClosed(cutoff,Infinity),true);
});

test("detail event time and cutoff use same verified venue source as Today",()=>{
 const detail=readFileSync("masjid-mobile/app/details/[kind]/[id].tsx","utf8");
 const today=readFileSync("masjid-mobile/app/(tabs)/index.tsx","utf8");
 const locales=readFileSync("masjid-mobile/src/i18n.tsx","utf8");

 assert.match(detail,/gatheringLocalTime\(instant,item\?\.venue\?\.timeZone,/);
 assert.match(detail,/result\.data\?\.organization\?\.timeZone,language/);
 assert.match(detail,/isGatheringDeadlineClosed\(item\?\.rsvpDeadlineAt\|\|item\?\.startAt\)/);
 assert.match(detail,/isGatheringDeadlineClosed\(item\?\.cancellationDeadlineAt\|\|item\?\.startAt\)/);
 assert.match(detail,/formatGatheringInstant\(item\.startAt\)/);
 assert.match(detail,/formatGatheringInstant\(item\.endAt\)/);
 assert.match(detail,/formatGatheringInstant\(item\.rsvpDeadlineAt\|\|item\.startAt\)/);
 assert.match(detail,/formatGatheringInstant\(item\.cancellationDeadlineAt\|\|item\.startAt\)/);
 assert.match(detail,/formatGatheringInstant\(own\.data\.registration\.checkedInAt\)/);
 assert.match(today,/gatheringLocalTime\(e\.startAt,e\.venue\?\.timeZone,/);
 assert.doesNotMatch(detail,/function gatheringTime\(/);
 assert.doesNotMatch(detail,/gatheringTime\(/);
 assert.doesNotMatch(detail,/new Date\(own\.data\.registration\.checkedInAt\)\.toLocaleString\(/);
 for(const key of ["detailsStarts","detailsEnds","detailsRsvpCloses","detailsCancelCloses",
   "detailsArrival","detailsVenueZone","detailsOrganizationZone","detailsUnknownTime",
   "detailsClosed"]){
  assert.match(locales,new RegExp('"gathering\\.'+key+'":\\{en:".+",ar:".+"\\}'),key);
  assert.ok(detail.includes('t("gathering.'+key+'")')||
    detail.includes('"gathering.'+key+'"'),key);
 }
});

test("event details never pretend organization time is a verified venue time",()=>{
 const when="2026-11-01T06:30:00.000Z";
 const atVenue=gatheringLocalTime(when,"America/New_York","Asia/Dubai","en");
 const atOrg=gatheringLocalTime(when,null,"Asia/Dubai","ar");
 assert.ok(atVenue&&atOrg);
 assert.equal(atVenue.source,"venue");
 assert.equal(atOrg.source,"organization");
 assert.equal(atVenue.timeZone,"America/New_York");
 assert.equal(atOrg.timeZone,"Asia/Dubai");
 assert.equal(gatheringLocalTime(when,"Invalid/Zone","Asia/Dubai","en"),null);
 assert.equal(gatheringLocalTime(when,null,null,"en"),null);
});


test("event detail revalidates publication after resume and checks deadlines again on click",()=>{
 const screen=readFileSync("masjid-mobile/app/details/[kind]/[id].tsx","utf8");
 const lifecycle=readFileSync("masjid-mobile/src/useVenueSafetyRefresh.ts","utf8");
 assert.match(screen,/useVenueSafetyRefresh\(kind==="events"&&id!=="all"&&!!path,result\.refresh\)/);
 assert.match(screen,/if\(kind==="events"&&isGatheringDeadlineClosed\(item\.rsvpDeadlineAt\|\|item\.startAt\)\)/);
 assert.match(screen,/if\(isGatheringDeadlineClosed\(item\.cancellationDeadlineAt\|\|item\.startAt\)\)/);
 assert.match(lifecycle,/AppState\.addEventListener\("change"/);
 assert.match(lifecycle,/setInterval\(\(\)=>void refresh\(\),60_000\)/);
});
