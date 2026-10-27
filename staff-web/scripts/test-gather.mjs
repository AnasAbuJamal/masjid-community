// Full-event capacity, waitlist and promotion tests on an isolated CI database.
import assert from "node:assert/strict";
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
let eventId,closedId,otherEventId,otherOrgId;
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
 const listing=await request("public/events");
 assert.equal(listing.status,200);
 assert.ok(listing.data.items.some(x=>x.id===eventId&&x.waitlistEnabled&&x.capacity===1),"public event shows waitlist policy");
 const guest=await request("actions","POST",{kind:"rsvp",eventId});
 assert.equal(guest.status,401,"guest cannot reserve a place");
 const first=await request("actions","POST",{kind:"rsvp",eventId},memberToken);
 assert.equal(first.status,201);
 assert.equal(first.data.status,"confirmed");
 assert.equal(first.data.joined,true);
 const second=await request("actions","POST",{kind:"rsvp",eventId},staffToken);
 assert.equal(second.status,201);
 assert.equal(second.data.status,"waitlisted");
 assert.equal(second.data.joined,false,"waitlist may not masquerade as confirmed");
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
 assert.equal((await db.event.findUnique({where:{id:eventId}})).rsvpCount,1,"promotion retains seat count");
 assert.equal(await db.notification.count({where:{userId:staff.data.user.id,title:"Your event place is confirmed"}}),1);
 const idempotentCancellation=await request("events/rsvp","DELETE",{eventId},memberToken);
 assert.equal(idempotentCancellation.status,200);
 assert.equal(idempotentCancellation.data.alreadyCancelled,true);
 const leave=await request("events/rsvp","DELETE",{eventId},staffToken);
 assert.equal(leave.status,200);
 assert.equal(leave.data.promotedWaitlist,false);
 assert.equal((await db.event.findUnique({where:{id:eventId}})).rsvpCount,0);
 const deniedEvent=await db.event.create({data:{...fixture,title:"CI gathering without waitlist",waitlistEnabled:false}});
 closedId=deniedEvent.id;
 const accepted=await request("actions","POST",{kind:"rsvp",eventId:closedId},memberToken);
 assert.equal(accepted.status,201);
 const full=await request("actions","POST",{kind:"rsvp",eventId:closedId},staffToken);
 assert.equal(full.status,409,"full event without waitlist rejects reservation");
 assert.equal(full.error.code,"EVENT_FULL");
 assert.equal((await db.event.findUnique({where:{id:closedId}})).rsvpCount,1);
 // A second organization is never accessible to a member of the first one.
 const otherOrg=await db.organization.create({data:{slug:"gather-ci-"+Date.now(),name:"Isolated mosque"}});
 otherOrgId=otherOrg.id;
 const otherEvent=await db.event.create({data:{...fixture,organizationId:otherOrgId,title:"Private organization event"}});
 otherEventId=otherEvent.id;
 const foreign=await request("actions","POST",{kind:"rsvp",eventId:otherEventId},memberToken);
 assert.equal(foreign.status,404,"a foreign organization's published event cannot be reserved");
 const foreignCancel=await request("events/rsvp","DELETE",{eventId:otherEventId},memberToken);
 assert.equal(foreignCancel.status,404,"foreign event cancellation must not leak its existence");
 console.log("Verified confirmed seats, honest waitlist, cancellation promotion, notices, idempotency, capacity and organization isolation.");
}finally{
 for(const id of [eventId,closedId,otherEventId].filter(Boolean)){
  await db.eventRSVP.deleteMany({where:{eventId:id}});
  await db.event.deleteMany({where:{id}});
 }
 if(otherOrgId)await db.organization.deleteMany({where:{id:otherOrgId}});
 await db.$disconnect();
}
