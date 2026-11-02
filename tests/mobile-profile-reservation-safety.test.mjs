import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 profileReservationLabelKey,canOfferProfileCancellation
} from "../masjid-mobile/src/profile-reservation.ts";
import {gatheringLocalTime} from "../masjid-mobile/src/gathering-local-time.ts";
import {createScopedActionGate} from "../masjid-mobile/src/scoped-action-gate.ts";

const read=p=>readFileSync(p,"utf8");
const now=Date.parse("2027-04-01T12:00:00.000Z");
const future="2027-04-01T14:00:00.000Z";
const cutoff="2027-04-01T13:00:00.000Z";

test("dashboard never converts an unknown RSVP into a confirmed seat",()=>{
 assert.equal(profileReservationLabelKey("waitlisted",null),"profile.reservationWaitlisted");
 assert.equal(profileReservationLabelKey("confirmed",null),"profile.reservationConfirmed");
 assert.equal(profileReservationLabelKey("confirmed","2027-04-01T12:30:00.000Z"),"profile.reservationCheckedIn");
 assert.equal(profileReservationLabelKey("checked_in",null),"profile.reservationCheckedIn");
 for(const unknown of ["", "pending","cancelled","rejected","admin","CONFIRMED"]){
  assert.equal(profileReservationLabelKey(unknown,null),"profile.reservationUnverified",unknown);
 }
});

test("cancel button closes at cutoff, start, after check-in, and on malformed data",()=>{
 assert.equal(canOfferProfileCancellation("confirmed",null,future,cutoff,now),true);
 assert.equal(canOfferProfileCancellation("waitlisted",null,future,cutoff,now),true);
 assert.equal(canOfferProfileCancellation("waitlisted",null,future,null,now),true,
  "legacy records without explicit cutoff inherit event start");
 assert.equal(canOfferProfileCancellation("confirmed",null,future,cutoff,Date.parse(cutoff)),false);
 assert.equal(canOfferProfileCancellation("confirmed",null,future,cutoff,Date.parse(future)),false);
 assert.equal(canOfferProfileCancellation("confirmed",null,future,null,Date.parse(future)),false);
 assert.equal(canOfferProfileCancellation("confirmed","2027-04-01T11:30:00.000Z",future,cutoff,now),false);
 assert.equal(canOfferProfileCancellation("pending",null,future,cutoff,now),false);
 assert.equal(canOfferProfileCancellation("confirmed",null,future,"not-a-cutoff",now),false);
 assert.equal(canOfferProfileCancellation("confirmed",null,"not-a-date",null,now),false);
 assert.equal(canOfferProfileCancellation("confirmed",null,future,cutoff,NaN),false);
 // An administrator may accidentally record a cutoff after the event start:
 // client still refuses an after-start cancellation.
 assert.equal(canOfferProfileCancellation("confirmed",null,cutoff,future,Date.parse(cutoff)),false);
});

test("profile dates use the authorized mosque's timezone and fail without it",()=>{
 const value="2027-11-07T06:30:00.000Z";
 const chicago=gatheringLocalTime(value,null,"America/Chicago","en");
 const cairo=gatheringLocalTime(value,null,"Africa/Cairo","ar");
 assert.ok(chicago&&cairo);
 assert.equal(chicago.source,"organization");
 assert.equal(chicago.timeZone,"America/Chicago");
 assert.equal(cairo.timeZone,"Africa/Cairo");
 assert.notEqual(chicago.text,cairo.text);
 assert.equal(gatheringLocalTime(value,null,null,"en"),null);
 assert.equal(gatheringLocalTime(value,null,"Bad/Zone","ar"),null);
});

test("a second account/mosque cannot inherit an earlier cancellation receipt or lock",()=>{
 const gate=createScopedActionGate();
 gate.bind("version-1|member-a|pilot");
 const old=gate.begin();
 assert.notEqual(old,null);
 assert.equal(gate.begin(),null);
 gate.bind("version-2|member-b|limited");
 assert.equal(gate.isCurrent(old),false);
 const fresh=gate.begin();
 assert.notEqual(fresh,null);
 assert.equal(gate.finish(old),false);
 assert.equal(gate.isCurrent(fresh),true);
 assert.equal(gate.finish(fresh),true);
 gate.invalidate();
 assert.equal(gate.begin(),null);
});

test("native profile cancel UI and backend agree on current owner and cutoff",()=>{
 const screen=read("masjid-mobile/app/(tabs)/profile.tsx");
 const route=read("staff-web/src/app/api/v1/me/route.ts");
 const cancel=read("staff-web/src/app/api/v1/events/rsvp/route.ts");
 assert.match(route,/db\.eventRSVP\.findMany\(\{where:\{userId:user\.id,event:\{organizationId:org\.id\}\}/);
 assert.match(route,/cancellationDeadlineAt:true/);
 assert.match(screen,/user\?\.isVerified\?"me":null/);
 assert.match(screen,/contextVersion,user\?\.id\|\|"guest"/);
 assert.match(screen,/actionGate\.current\.bind\(actionScope\)/);
 assert.match(screen,/actionGate\.current\.invalidate\(\)/);
 assert.match(screen,/actionGate\.current\.begin\(\)/);
 assert.match(screen,/actionGate\.current\.isCurrent\(ticket\)/);
 assert.match(screen,/actionGate\.current\.finish\(ticket\)/);
 assert.match(screen,/response\.cancelled!==true/);
 assert.match(screen,/if\(!registration\|\|!canOfferProfileCancellation\(/);
 assert.match(screen,/canChange&&canOfferProfileCancellation\(r\.status,r\.checkedInAt,r\.event\.startAt,/);
 assert.match(screen,/r\.event\.cancellationDeadlineAt,nowMs/);
 assert.match(screen,/gatheringLocalTime\(iso,null,result\.data\?\.organization\?\.timeZone,language\)/);
 assert.match(screen,/profileReservationLabelKey\(r\.status,r\.checkedInAt\)/);
 assert.match(screen,/t\("profile\.cancelFailed"\)/);
 assert.doesNotMatch(screen,/new Date\(b\.startAt\)\.toLocaleString\(/);
 assert.doesNotMatch(screen,/value\.toLocaleString\(\)/);
 assert.doesNotMatch(screen,/new Date\(r\.event\.startAt\)>new Date\(\)/);
 assert.match(cancel,/membership\?\.status!=="active"/);
 assert.match(cancel,/checkedInAt/);
 assert.match(cancel,/event\.cancellationDeadlineAt&&event\.cancellationDeadlineAt<=new Date\(\)/);
});

test("member dashboard controls and statuses have bilingual reviewed labels",()=>{
 const screen=read("masjid-mobile/app/(tabs)/profile.tsx");
 const lang=read("masjid-mobile/src/i18n.tsx");
 for(const key of [
  "profile.guestHelp","profile.refreshVerification","profile.upcoming",
  "profile.shiftUnavailable","profile.shiftScheduled","profile.reservationWaitlisted",
  "profile.reservationCheckedIn","profile.reservationConfirmed",
  "profile.reservationUnverified","profile.timeUnavailable","profile.organizationTime",
  "profile.cancelRsvp","profile.leaveWaitlist","profile.cancelFailed",
  "profile.cancelUnverified","profile.cancelled","profile.pilotLimit",
  "profile.receipt","profile.settingsTitle","profile.notificationsTitle",
  "profile.mfaTitle","profile.shiftsTitle"
 ]){
  assert.match(lang,new RegExp('"'+key.replaceAll(".","\\.")+'":\\{en:".+",ar:".+"\\}'),key);
 }
 assert.match(screen,/t\("profile\.upcoming"\)/);
 assert.match(screen,/textAlign:isRTL\?"right":"left"/);
 assert.match(screen,/t\("profile\.pilotLimit"\)/);
 assert.match(screen,/t\("profile\.organizationTime"\)/);
});
