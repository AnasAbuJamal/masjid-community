import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 canonicalRentalInstant,canonicalRentalRange
} from "../masjid-mobile/src/rental-time-input.ts";

const read=p=>readFileSync(p,"utf8");

test("facility bookings require unambiguous explicit-offset timestamps",()=>{
 assert.equal(canonicalRentalInstant("2027-06-15T09:00:00-04:00"),
  "2027-06-15T13:00:00.000Z");
 assert.equal(canonicalRentalInstant("2027-06-15T09:00:00Z"),
  "2027-06-15T09:00:00.000Z");
 assert.equal(canonicalRentalInstant("2027-06-15T09:00:00.123+02:30"),
  "2027-06-15T06:30:00.123Z");
 for(const invalid of [
  "2027-06-15","2027-06-15T09:00","2027-06-15T09:00:00",
  "2027-02-30T09:00:00Z","2027-13-15T09:00:00Z",
  "2027-11-07T25:00:00Z","2027-06-15T09:90:00Z",
  "2027-06-15T09:00:00+99:00","2027-06-15T09:00:00-04:99",
  "random","2027-06-15T09:00:00Z?private=true"
 ]){
  assert.equal(canonicalRentalInstant(invalid),null,invalid);
 }
});

test("DST fall-back, reversed time and seven-day boundary retain absolute-time semantics",()=>{
 const first="2027-11-07T01:30:00-04:00";
 const second="2027-11-07T01:30:00-05:00";
 assert.deepEqual(canonicalRentalRange(first,second),{
  valid:true,startAt:"2027-11-07T05:30:00.000Z",
  endAt:"2027-11-07T06:30:00.000Z"
 });
 assert.deepEqual(canonicalRentalRange(second,first),{valid:false,problem:"order"});
 assert.deepEqual(canonicalRentalRange(first,first),{valid:false,problem:"order"});
 assert.deepEqual(canonicalRentalRange("2027-06-15T00:00:00Z","2027-06-22T00:00:00Z"),{
  valid:true,startAt:"2027-06-15T00:00:00.000Z",
  endAt:"2027-06-22T00:00:00.000Z"
 });
 assert.deepEqual(canonicalRentalRange("2027-06-15T00:00:00Z","2027-06-22T00:00:01Z"),
  {valid:false,problem:"tooLong"});
 assert.deepEqual(canonicalRentalRange("invalid",second),{valid:false,problem:"invalid"});
});

test("secondary details UI validates requests before posting without claiming bookings",()=>{
 const screen=read("masjid-mobile/app/details/[kind]/[id].tsx");
 assert.match(screen,/canonicalRentalRange\(from,to\)/);
 assert.match(screen,/if\(rentalRange&&!rentalRange\.valid\)/);
 assert.match(screen,/rentalRange\.startAt,endAt:rentalRange\.endAt/);
 assert.match(screen,/letter\.trim\(\)\.length<10/);
 assert.match(screen,/t\("detail\.coverLetterMin"\)/);
 assert.match(screen,/t\("detail\.rentalDateExample"\)/);
 assert.match(screen,/t\("detail\.chooseDonation"\)/);
 assert.match(screen,/t\("detail\.actionVolunteer"\)/);
 assert.match(screen,/t\("detail\.actionProposal"\)/);
 assert.match(screen,/t\("detail\.actionJob"\)/);
 assert.match(screen,/t\("detail\.actionRental"\)/);
 assert.match(screen,/gatheringLocalTime\(instant,null,/);
 assert.match(screen,/result\.data\?\.organization\?\.timeZone,language/);
 assert.match(screen,/formatOrganizationInstant\(m\.completedAt\)/);
 assert.match(screen,/formatOrganizationInstant\(item\.startAt\|\|item\.startsAt\)/);
 assert.doesNotMatch(screen,/new Date\(from\)\.toISOString\(\)/);
 assert.doesNotMatch(screen,/new Date\(m\.completedAt\)\.toLocaleDateString\(\)/);
 const server=read("staff-web/src/app/api/v1/actions/route.ts");
 assert.match(server,/end\.getTime\(\)-start\.getTime\(\)>7\*86400000/);
 assert.match(server,/status:row\.status,message:"Request sent for review; booking not confirmed\."/);
});

test("published and selected-mosque detail response carries the correct timezone",()=>{
 const visitor=read("staff-web/src/app/api/v1/public/[resource]/route.ts");
 const selected=read("staff-web/src/app/api/v1/organizations/view/route.ts");
 assert.match(visitor,/return ok\(\{organization:\{id:org\.id,name:org\.name,timeZone:org\.timeZone\},items:data\}\)/);
 assert.match(selected,/return ok\(\{organization:\{id:org\.id,name:org\.name,timeZone:org\.timeZone\},items,/);
 const locales=read("masjid-mobile/src/i18n.tsx");
 for(const key of [
  "detail.chooseDonation","detail.actionVolunteer","detail.actionProposal",
  "detail.actionJob","detail.actionRental","detail.coverLetterLabel",
  "detail.rentalFrom","detail.rentalTo","detail.organization",
  "detail.projectMilestones","detail.completed","detail.inProgress",
  "detail.unknownDate","detail.organizationTime","detail.coverLetterMin",
  "detail.rentalDateInvalid","detail.rentalDateOrder",
  "detail.rentalDateTooLong","detail.rentalDateExample"
 ]){
  assert.match(locales,new RegExp('"'+key.replaceAll(".","\\.")+'":\\{en:".+",ar:".+"\\}'),key);
 }
});
