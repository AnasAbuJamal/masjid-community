// Authorized operational status: no personal information, no public
// access, counters reflect disposable CI fixtures. No provider network.
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {PrismaClient} from "@prisma/client";
if(process.env.GITHUB_ACTIONS!=="true"||process.env.NODE_ENV==="production"||
 !process.env.DATABASE_URL?.endsWith("/masjid_ci")||process.env.VERCEL)
 throw Error("Operational monitoring tests only run in disposable CI.");
const db=new PrismaClient();
const base="http://127.0.0.1:3000";
const key=process.env.SILA_OPERATIONS_SECRET;
const {memberEmail}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
assert.ok(key&&key.length>=32&&key!==process.env.CRON_SECRET);
const created=[];
async function response(path,authorization){
 const res=await fetch(base+path,{headers:authorization?{authorization}:{}});
 return {status:res.status,headers:res.headers,body:await res.json()};
}
try{
 const live=await response("/api/health");
 assert.equal(live.status,200);
 assert.equal(live.body.data.status,"alive");
 assert.equal(live.body.data.check,"liveness");
 assert.ok(!JSON.stringify(live.body).includes("DATABASE_URL"));
 const ready=await response("/api/ready");
 assert.equal(ready.status,200);
 assert.equal(ready.body.data.status,"ready");
 assert.ok(!JSON.stringify(ready.body).includes("postgresql"));
 const unauth=await response("/api/internal/operations");
 assert.equal(unauth.status,401);
 const wrong=await response("/api/internal/operations","Bearer not-a-secret");
 assert.equal(wrong.status,401);
 assert.ok(!JSON.stringify(unauth.body).includes("outbox"));
 const workerKey=await response("/api/internal/operations","Bearer "+process.env.CRON_SECRET);
 assert.equal(workerKey.status,401,"delivery worker key cannot read private operational telemetry");
 const baseline=await response("/api/internal/operations","Bearer "+key);
 assert.equal(baseline.status,200);
 assert.equal(baseline.headers.get("cache-control"),"no-store");
 assert.equal(baseline.body.data.finance.reconciliationCertified,false);
 const org=await db.organization.findFirstOrThrow({orderBy:{createdAt:"asc"}});
 const member=await db.user.findUniqueOrThrow({where:{email:memberEmail}});
 const now=new Date(),old=new Date(now.getTime()-2*3600_000);
 for(const state of ["pending","retry","leased","exhausted"]){
  const notice=await db.notification.create({data:{
   organizationId:org.id,userId:member.id,
   title:"Synthetic operational monitoring "+randomUUID(),
   body:"Private details must never appear in the operations API."
  }});
  created.push(notice.id);
  await db.outboxEvent.create({data:{
   notificationId:notice.id,userId:member.id,status:state,
   availableAt:old,createdAt:old,attempts:state==="pending"?0:1,
   ...(state==="leased"?{leaseUntil:old}:{})
  }});
 }
 const after=await response("/api/internal/operations","Bearer "+key);
 assert.equal(after.status,200);
 const x=after.body.data;
 assert.ok(x.outbox.pending>=baseline.body.data.outbox.pending+1);
 assert.ok(x.outbox.retry>=baseline.body.data.outbox.retry+1);
 assert.ok(x.outbox.leased>=baseline.body.data.outbox.leased+1);
 assert.ok(x.outbox.exhausted>=baseline.body.data.outbox.exhausted+1);
 assert.ok(x.outbox.overdue15m>=baseline.body.data.outbox.overdue15m+2);
 assert.ok(x.outbox.expiredLeases>=baseline.body.data.outbox.expiredLeases+1);
 assert.ok(x.outbox.oldestDueMinutes>=90);
 assert.equal(x.state,"attention");
 assert.ok(Number.isInteger(x.privacy.requestsAwaitingReview));
 assert.ok(Number.isInteger(x.finance.unresolvedRefundWorkflows));
 assert.equal(x.finance.reconciliationCertified,false);
 const out=JSON.stringify(x);
 for(const secret of [member.email,member.id,org.name,org.slug,
  "Private details must never appear",process.env.CRON_SECRET,key,
  process.env.DATABASE_URL]){
  assert.ok(!out.includes(secret),"operations API must expose counts only");
 }
 console.log("Verified public process liveness, separate DB readiness, independently authorized aggregate operations signals and adversarial privacy checks.");
}finally{
 if(created.length){
  await db.outboxEvent.deleteMany({where:{notificationId:{in:created}}});
  await db.notification.deleteMany({where:{id:{in:created}}});
 }
 await db.$disconnect();
}
