import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {profileStatusLabelKey} from "../masjid-mobile/src/profile-status.ts";
const read=p=>readFileSync(p,"utf8");

test("payment, facility and application status keys never claim unverified completion",()=>{
 const cases={
  payment:{pending:"profile.paymentPending",paid:"profile.paymentPaid",
   failed:"profile.paymentFailed",refunded:"profile.paymentRefunded"},
  booking:{requested:"profile.bookingRequested",approved:"profile.bookingApproved",
   cancelled:"profile.bookingCancelled",rejected:"profile.bookingRejected"},
  application:{submitted:"profile.applicationSubmitted",approved:"profile.applicationApproved",
   declined:"profile.applicationDeclined",withdrawn:"profile.applicationWithdrawn"}
 };
 for(const [kind,values] of Object.entries(cases)){
  for(const [value,expected] of Object.entries(values))
   assert.equal(profileStatusLabelKey(kind,value),expected,kind+":"+value);
  for(const unknown of ["", "pending_payment","PAID","approved ", "reconciled",
   "verified","scheduled","waitlisted"])
   if(!(unknown in values))
    assert.equal(profileStatusLabelKey(kind,unknown),"profile.statusUnverified",kind+":"+unknown);
 }
 assert.notEqual(profileStatusLabelKey("booking","requested"),
  profileStatusLabelKey("booking","approved"),"request cannot masquerade as an approved facility booking");
 assert.notEqual(profileStatusLabelKey("payment","pending"),
  profileStatusLabelKey("payment","paid"),"unpaid donations cannot appear settled");
});

test("current Prisma server states all have bilingual member dashboard labels",()=>{
 const model=read("staff-web/prisma/schema.prisma");
 const dict=read("masjid-mobile/src/i18n.tsx");
 const required=[
  ["PaymentStatus","payment"],
  ["BookingStatus","booking"],
  ["ApplicationStatus","application"]
 ];
 for(const [enumName,domain] of required){
  const match=model.match(new RegExp('enum '+enumName+' \\{([\\s\\S]*?)\\}'));
  assert.ok(match,enumName+" model must exist");
  const values=match[1].split(/\s+/).filter(Boolean);
  assert.ok(values.length>=4,enumName);
  for(const value of values){
   const key=profileStatusLabelKey(domain,value);
   assert.notEqual(key,"profile.statusUnverified",enumName+":"+value);
   assert.match(dict,new RegExp('"'+key.replaceAll(".","\\.")+'":\\{en:".+",ar:".+"\\}'),key);
  }
 }
 assert.match(dict,/"profile\.statusUnverified":\{en:".+",ar:".+"\}/);
});

test("native member cards display truthful labels, not raw server status tokens",()=>{
 const screen=read("masjid-mobile/app/(tabs)/profile.tsx");
 assert.match(screen,/t\(profileStatusLabelKey\("payment",d\.status\)\)/);
 assert.match(screen,/t\(profileStatusLabelKey\("booking",b\.status\)\)/);
 assert.match(screen,/t\(profileStatusLabelKey\("application",v\.status\)\)/);
 assert.match(screen,/t\(profileStatusLabelKey\("application",j\.status\)\)/);
 assert.doesNotMatch(screen,/ · \{b\.status\}/);
 assert.doesNotMatch(screen,/ · \{d\.status\}/);
 assert.doesNotMatch(screen,/>\{v\.status\}<\/Text>/);
 assert.doesNotMatch(screen,/>\{j\.status\}<\/Text>/);
 const api=read("staff-web/src/app/api/v1/me/route.ts");
 for(const token of [
  "donorId:user.id,campaign:{organizationId:org.id}",
  "userId:user.id,resource:{organizationId:org.id}",
  "userId:user.id,opportunity:{organizationId:org.id}",
  "userId:user.id,job:{organizationId:org.id}"
 ])assert.ok(api.includes(token),token+" must remain tenant-scoped");
});
