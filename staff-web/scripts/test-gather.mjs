// Full-event capacity, waitlist and promotion tests on an isolated CI database.
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";
if(process.env.NODE_ENV==="production"||process.env.VERCEL||!process.env.DATABASE_URL?.includes("masjid_ci"))
 throw Error("Refusing to run gathering tests outside isolated CI.");
const {memberEmail,staffEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const db=new PrismaClient();
const base="http://127.0.0.1:3000/api/v1/";
async function request(path,method="GET",payload,token){
 const response=await fetch(base+path,{
  method,headers:{...(token?{"Authorization":"Bearer "+token}:{}),...(payload?{"Content-Type":"application/json"}:{})},
  body:payload?JSON.stringify(payload):undefined
 });
 const body=await response.json().catch(()=>({}));
 return {status:response.status,...body};
}
let eventId,closedId,otherEventId,otherOrgId,screenedEventId,policyEventId;
let categorizedEventId,homeVenueId,otherVenueId;
const syntheticUsers=[];
try{
 const organization=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(organization);
 const member=await request("auth/login","POST",{email:memberEmail,password});
 const staff=await request("auth/login","POST",{email:staffEmail,password});
 assert.equal(member.status,200);
 assert.equal(staff.status,200);
 const memberToken=member.data.token,staffToken=staff.data.token;
 const fixture={
  organizationId:organization.id,title:"CI waitlist gathering",
  description:"Verify the complete and safe event waitlist lifecycle.",
  location:"Community hall",startAt:new Date("2032-11-05T15:00:00Z"),endAt:new Date("2032-11-05T16:00:00Z"),
  capacity:1,status:"published",waitlistEnabled:true
 };
 const event=await db.event.create({data:fixture});
 eventId=event.id;
 const calendarResponse=await fetch(base+"events/"+eventId+"/calendar");
 assert.equal(calendarResponse.status,200,"published public gathering has a calendar export");
 assert.match(calendarResponse.headers.get("content-type"),/text\/calendar/);
 const calendarText=await calendarResponse.text();
 assert.match(calendarText,/DTSTART:20321105T150000Z/);
 assert.match(calendarText,/DTEND:20321105T160000Z/);
 assert.match(calendarText,/This does not reserve a place/,"download cannot claim registration");
 assert.doesNotMatch(calendarText,/ATTENDEE:/,"calendar export contains no attendee details");

 // F-007: published guest AND verified selected-mosque catalogs support
 // structured, organizer-confirmed metadata without inventing attributes for
 // legacy records. Dates are exact instants, not guessed venue-local days.
 const homeVenue=await db.venue.create({data:{
  organizationId:organization.id,name:"CI FILTERED GATHERING VENUE",
  address:"Fictional accessible community hall",timeZone:"America/New_York"
 }});
 homeVenueId=homeVenue.id;
 const categorizedEvent=await db.event.create({data:{
  ...fixture,title:"CI filterable gathering",startAt:new Date("2032-11-06T15:00:00Z"),
  endAt:new Date("2032-11-06T16:00:00Z"),venueId:homeVenue.id,
  category:"workshop",audience:"families",
  accessibilityFeatures:["step_free","quiet_space"],
  accessibilityNotes:"The organizer confirmed step-free entry and a quiet room."
 }});
 categorizedEventId=categorizedEvent.id;
 const guestPublished=await request("public/events?category=workshop");
 assert.equal(guestPublished.status,200,JSON.stringify(guestPublished));
 assert.ok(guestPublished.data.items.some(x=>x.id===categorizedEvent.id));
 const displayed=guestPublished.data.items.find(x=>x.id===categorizedEvent.id);
 assert.equal(displayed.venue.id,homeVenue.id);
 assert.equal(displayed.venue.timeZone,"America/New_York");
 assert.equal(Object.hasOwn(displayed.venue,"organizationId"),false);
 assert.equal(displayed.audience,"families");
 assert.deepEqual(displayed.accessibilityFeatures,["step_free","quiet_space"]);
 const memberPublished=await request("events/catalog?category=workshop&audience=families"+
  "&accessibility=step_free&venueId="+homeVenue.id,"GET",null,memberToken);
 assert.equal(memberPublished.status,200,JSON.stringify(memberPublished));
 assert.deepEqual(memberPublished.data.items.map(x=>x.id),[categorizedEvent.id]);
 const withinDates=await request("public/events?from=2032-11-06T00%3A00%3A00.000Z"+
  "&to=2032-11-07T00%3A00%3A00.000Z&category=workshop");
 assert.deepEqual(withinDates.data.items.map(x=>x.id),[categorizedEvent.id]);
 const dateMismatch=await request("events/catalog?from=2032-11-05T00%3A00%3A00.000Z"+
  "&to=2032-11-06T00%3A00%3A00.000Z&category=workshop","GET",null,memberToken);
 assert.equal(dateMismatch.status,200);
 assert.ok(!dateMismatch.data.items.some(x=>x.id===categorizedEvent.id));
 const noFeature=await request("public/events?accessibility=hearing_support&category=workshop");
 assert.equal(noFeature.status,200);
 assert.ok(!noFeature.data.items.some(x=>x.id===categorizedEvent.id));
 for(const path of ["public/events","events/catalog"]){
  const auth=path==="events/catalog"?memberToken:undefined;
  for(const query of [
   "category=invalid","audience=unknown","accessibility=wheelchair_all",
   "category=workshop&category=lecture",
   "organizationId="+organization.id,
   "eventId="+categorizedEvent.id+"&category=workshop",
   "from=2032-11-07T00%3A00%3A00.000Z&to=2032-11-06T00%3A00%3A00.000Z"
  ]){
   const rejected=await request(path+"?"+query,"GET",undefined,auth);
   assert.equal(rejected.status,422,
    "invalid, conflicting or tenant-hint filters must be rejected: "+path+"?"+query);
  }
 }
 const oldDetails=await request("public/events?eventId="+event.id);
 assert.equal(oldDetails.status,200);
 assert.equal(oldDetails.data.items[0].venue,null,"legacy gatherings do not invent a venue");
 assert.deepEqual(oldDetails.data.items[0].accessibilityFeatures,[]);
 const listing=await request("public/events");
 assert.equal(listing.status,200);
 assert.ok(listing.data.items.some(x=>x.id===eventId&&x.waitlistEnabled&&x.capacity===1),"public event shows waitlist policy");
 const guest=await request("actions","POST",{kind:"rsvp",eventId});
 assert.equal(guest.status,401,"guest cannot reserve a place");
 const first=await request("actions","POST",{kind:"rsvp",eventId},memberToken);
 assert.equal(first.status,201);
 assert.equal(first.data.status,"confirmed");
 assert.equal(first.data.joined,true);
 const guestRegistration=await request("events/registration?eventId="+eventId);
 assert.equal(guestRegistration.status,401,"guest cannot read member reservation state");
 const ownConfirmed=await request("events/registration?eventId="+eventId,"GET",null,memberToken);
 assert.equal(ownConfirmed.status,200);
 assert.equal(ownConfirmed.data.registration.status,"confirmed");
 const second=await request("actions","POST",{kind:"rsvp",eventId},staffToken);
 assert.equal(second.status,201);
 assert.equal(second.data.status,"waitlisted");
 assert.equal(second.data.joined,false,"waitlist may not masquerade as confirmed");
 const ownWaitlisted=await request("events/registration?eventId="+eventId,"GET",null,staffToken);
 assert.equal(ownWaitlisted.status,200);
 assert.equal(ownWaitlisted.data.registration.status,"waitlisted");
 assert.ok(!Object.hasOwn(ownWaitlisted.data,"attendees"),"own status never exposes event roster");
 const duplicate=await request("actions","POST",{kind:"rsvp",eventId},staffToken);
 assert.equal(duplicate.status,201);
 assert.equal(duplicate.data.alreadyJoined,true);
 assert.equal(duplicate.data.status,"waitlisted");
 const count=await db.event.findUnique({where:{id:eventId}});
 assert.equal(count.rsvpCount,1,"waitlist does not consume a seat");
 assert.equal(await db.eventRSVP.count({where:{eventId,status:"confirmed"}}),1);
 assert.equal(await db.eventRSVP.count({where:{eventId,status:"waitlisted"}}),1);
 const leaveWaitlist=await request("events/rsvp","DELETE",{eventId},staffToken);
 assert.equal(leaveWaitlist.status,200);
 assert.equal(leaveWaitlist.data.promotedWaitlist,false);
 assert.equal((await db.event.findUnique({where:{id:eventId}})).rsvpCount,1,
  "leaving a waitlist never changes confirmed capacity");
 const rejoined=await request("actions","POST",{kind:"rsvp",eventId},staffToken);
 assert.equal(rejoined.status,201);
 assert.equal(rejoined.data.status,"waitlisted");
 const memberCancellation=await request("events/rsvp","DELETE",{eventId},memberToken);
 assert.equal(memberCancellation.status,200);
 assert.equal(memberCancellation.data.cancelled,true);
 assert.equal(memberCancellation.data.promotedWaitlist,true);
 const promoted=await db.eventRSVP.findUnique({where:{eventId_userId:{eventId,userId:staff.data.user.id}}});
 assert.equal(promoted.status,"confirmed","FIFO waiter becomes confirmed");
 const ownPromoted=await request("events/registration?eventId="+eventId,"GET",null,staffToken);
 assert.equal(ownPromoted.data.registration.status,"confirmed");
 assert.equal((await db.event.findUnique({where:{id:eventId}})).rsvpCount,1,"promotion retains seat count");
 assert.equal(await db.notification.count({where:{userId:staff.data.user.id,title:"Your event place is confirmed"}}),1);
 const idempotentCancellation=await request("events/rsvp","DELETE",{eventId},memberToken);
 assert.equal(idempotentCancellation.status,200);
 assert.equal(idempotentCancellation.data.alreadyCancelled,true);
 const leave=await request("events/rsvp","DELETE",{eventId},staffToken);
 assert.equal(leave.status,200);
 assert.equal(leave.data.promotedWaitlist,false);
 assert.equal((await db.event.findUnique({where:{id:eventId}})).rsvpCount,0);
 const ownCancelled=await request("events/registration?eventId="+eventId,"GET",null,staffToken);
 assert.equal(ownCancelled.data.registration,null);

 // Older waiters whose membership/account eligibility expired cannot be
 // promoted, but their historical RSVP rows must not be silently deleted.
 const screened=await db.event.create({data:{...fixture,title:"CI eligible-only waitlist"}});
 screenedEventId=screened.id;
 const initial=await request("actions","POST",{kind:"rsvp",eventId:screened.id},memberToken);
 assert.equal(initial.data?.status,"confirmed");
 for(const [index,reason] of ["suspended","unverified","disabled"].entries()){
  const user=await db.user.create({data:{
   email:"ci-waitlist-"+reason+"-"+randomUUID()+"@example.invalid",
   firstName:"Synthetic",lastName:"Ineligible",
   passwordHash:"not-a-valid-signin-hash",
   verifiedAt:reason==="unverified"?null:new Date(),
   status:reason==="disabled"?"disabled":"active"
  }});
  syntheticUsers.push(user.id);
  await db.organizationMembership.create({data:{
   organizationId:organization.id,userId:user.id,status:reason==="suspended"?"suspended":"active"
  }});
  await db.eventRSVP.create({data:{
   eventId:screened.id,userId:user.id,status:"waitlisted",
   createdAt:new Date(Date.UTC(2025,0,index+1))
  }});
 }
 const eligible=await request("actions","POST",{kind:"rsvp",eventId:screened.id},staffToken);
 assert.equal(eligible.data?.status,"waitlisted");
 const promotion=await request("events/rsvp","DELETE",{eventId:screened.id},memberToken);
 assert.equal(promotion.status,200,JSON.stringify(promotion));
 assert.equal(promotion.data.promotedWaitlist,true);
 const promotedStaff=await db.eventRSVP.findUniqueOrThrow({where:{
  eventId_userId:{eventId:screened.id,userId:staff.data.user.id}
 }});
 assert.equal(promotedStaff.status,"confirmed","first currently eligible waiter promoted");
 assert.equal(await db.eventRSVP.count({where:{
  eventId:screened.id,status:"waitlisted",userId:{in:syntheticUsers}
 }}),3,"ineligible historical waitlist rows remain untouched");
 assert.equal((await db.event.findUniqueOrThrow({where:{id:screened.id}})).rsvpCount,1);
 const noEligible=await request("events/rsvp","DELETE",{eventId:screened.id},staffToken);
 assert.equal(noEligible.status,200,JSON.stringify(noEligible));
 assert.equal(noEligible.data.promotedWaitlist,false);
 assert.equal((await db.event.findUniqueOrThrow({where:{id:screened.id}})).rsvpCount,0,
  "confirmed seat released if no eligible waiter");
 assert.equal(await db.eventRSVP.count({where:{eventId:screened.id,status:"confirmed"}}),0);
 const deniedEvent=await db.event.create({data:{...fixture,title:"CI gathering without waitlist",waitlistEnabled:false}});
 closedId=deniedEvent.id;
 const accepted=await request("actions","POST",{kind:"rsvp",eventId:closedId},memberToken);
 assert.equal(accepted.status,201);
 const full=await request("actions","POST",{kind:"rsvp",eventId:closedId},staffToken);
 assert.equal(full.status,409,"full event without waitlist rejects reservation");
 assert.equal(full.error.code,"EVENT_FULL");
 assert.equal((await db.event.findUnique({where:{id:closedId}})).rsvpCount,1);

 // Organizer-defined RSVP and cancellation cutoffs are distinct: an existing
 // confirmed attendee can safely retry the same RSVP after the deadline,
 // but a new attendee cannot join, even a waitlist. Earlier cancellations
 // must be denied without deleting the seat or promoting other attendees.
 const policyEvent=await db.event.create({data:{
  ...fixture,title:"CI event with explicit RSVP and cancellation cutoffs",
  capacity:2,waitlistEnabled:true,
  rsvpDeadlineAt:new Date(Date.now()-60000),
  cancellationDeadlineAt:new Date(Date.now()-60000),
  cancellationTerms:"Cancellations close at the posted cutoff; contact the host."
 }});
 policyEventId=policyEvent.id;
 const policyListing=await request("events/catalog?eventId="+policyEvent.id,"GET",null,memberToken);
 assert.equal(policyListing.status,200);
 assert.ok(policyListing.data.items[0].rsvpDeadlineAt,"client must receive the actual deadline");
 assert.match(policyListing.data.items[0].cancellationTerms,/Cancellations close/);
 const deniedJoin=await request("actions","POST",{kind:"rsvp",eventId:policyEvent.id},memberToken);
 assert.equal(deniedJoin.status,409);
 assert.equal(deniedJoin.error.code,"RSVP_CLOSED");
 assert.equal((await db.event.findUniqueOrThrow({where:{id:policyEvent.id}})).rsvpCount,0);
 await db.event.update({where:{id:policyEvent.id},data:{
  rsvpDeadlineAt:new Date(Date.now()+3600000)
 }});
 const firstPolicyJoin=await request("actions","POST",{kind:"rsvp",eventId:policyEvent.id},memberToken);
 assert.equal(firstPolicyJoin.status,201);
 assert.equal(firstPolicyJoin.data.status,"confirmed");
 await db.event.update({where:{id:policyEvent.id},data:{
  rsvpDeadlineAt:new Date(Date.now()-60000)
 }});
 const repeatedPolicyJoin=await request("actions","POST",{kind:"rsvp",eventId:policyEvent.id},memberToken);
 assert.equal(repeatedPolicyJoin.status,201,"the same accepted RSVP remains idempotent after deadline");
 assert.equal(repeatedPolicyJoin.data.alreadyJoined,true);
 const lateJoin=await request("actions","POST",{kind:"rsvp",eventId:policyEvent.id},staffToken);
 assert.equal(lateJoin.status,409);
 assert.equal(lateJoin.error.code,"RSVP_CLOSED");
 const lateCancel=await request("events/rsvp","DELETE",{eventId:policyEvent.id},memberToken);
 assert.equal(lateCancel.status,409);
 assert.equal(lateCancel.error.code,"CANCELLATION_CLOSED");
 assert.equal((await db.eventRSVP.findUniqueOrThrow({where:{
  eventId_userId:{eventId:policyEvent.id,userId:member.data.user.id}
 }})).status,"confirmed","refused late cancellation preserves the accepted seat");
 assert.equal((await db.event.findUniqueOrThrow({where:{id:policyEvent.id}})).rsvpCount,1);
 await db.event.update({where:{id:policyEvent.id},data:{
  cancellationDeadlineAt:new Date(Date.now()+3600000)
 }});
 const validCancellation=await request("events/rsvp","DELETE",{eventId:policyEvent.id},memberToken);
 assert.equal(validCancellation.status,200);
 assert.equal(validCancellation.data.cancelled,true);
 assert.equal((await db.event.findUniqueOrThrow({where:{id:policyEvent.id}})).rsvpCount,0);
 // A second organization is never accessible to a member of the first one.
 const otherOrg=await db.organization.create({data:{slug:"gather-ci-"+Date.now(),name:"Isolated mosque"}});
 otherOrgId=otherOrg.id;
 const otherVenue=await db.venue.create({data:{
  organizationId:otherOrgId,name:"CI FOREIGN VENUE",timeZone:"America/Chicago"
 }});
 otherVenueId=otherVenue.id;
 const otherEvent=await db.event.create({data:{
  ...fixture,organizationId:otherOrgId,venueId:otherVenue.id,
  title:"Private organization event",category:"workshop",
  audience:"families",accessibilityFeatures:["step_free"]
 }});
 otherEventId=otherEvent.id;
 for(const endpoint of ["public/events","events/catalog"]){
  const selected=endpoint==="events/catalog"?memberToken:undefined;
  const forbidden=await request(endpoint+"?venueId="+otherVenue.id,"GET",null,selected);
  assert.equal(forbidden.status,404,"venue filter may not select a foreign mosque");
 }
 await assert.rejects(db.event.create({data:{
  ...fixture,venueId:otherVenue.id,category:"workshop"
 }}),"database rejects foreign venue references");
 await assert.rejects(db.venue.update({where:{id:homeVenue.id},
  data:{organizationId:otherOrgId}}),
  "assigned venue cannot transfer across mosques");
 const foreignPublished=await request("public/events?category=workshop");
 assert.ok(!foreignPublished.data.items.some(x=>x.id===otherEvent.id),
  "guest venue/category catalog never crosses mosques");
 const foreign=await request("actions","POST",{kind:"rsvp",eventId:otherEventId},memberToken);
 assert.equal(foreign.status,404,"a foreign organization's published event cannot be reserved");
 const foreignCancel=await request("events/rsvp","DELETE",{eventId:otherEventId},memberToken);
 assert.equal(foreignCancel.status,404,"foreign event cancellation must not leak its existence");
 const foreignRegistration=await request("events/registration?eventId="+otherEventId,"GET",null,memberToken);
 assert.equal(foreignRegistration.status,404,"member cannot read foreign event registration state");
 const foreignCalendar=await fetch(base+"events/"+otherEventId+"/calendar");
 assert.equal(foreignCalendar.status,404,"public calendar rejects events from other mosques");
 console.log("Verified confirmed seats, eligible-only waitlist promotion, ineligible state preservation, notices, idempotency, capacity and organization isolation.");
}finally{
 for(const id of [eventId,closedId,otherEventId,screenedEventId,policyEventId,categorizedEventId].filter(Boolean)){
  await db.eventRSVP.deleteMany({where:{eventId:id}});
  await db.event.deleteMany({where:{id}});
 }
 if(otherVenueId)await db.venue.deleteMany({where:{id:otherVenueId}});
 if(homeVenueId)await db.venue.deleteMany({where:{id:homeVenueId}});
 if(syntheticUsers.length){
  await db.organizationMembership.deleteMany({where:{userId:{in:syntheticUsers}}});
  await db.user.deleteMany({where:{id:{in:syntheticUsers}}});
 }
 if(otherOrgId)await db.organization.deleteMany({where:{id:otherOrgId}});
 await db.$disconnect();
}
