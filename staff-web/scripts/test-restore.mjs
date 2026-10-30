// True logical restore regression, with no production or fixture DB writes.
// pg_dump/pg_restore are performed by the workflow. This script verifies the
// restored relational and private-state contents, migration history, foreign
// keys, and the fact that restoration cannot modify its source database.
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync,readdirSync} from "node:fs";
import {PrismaClient} from "@prisma/client";

function checkedUrl(raw,dbName){
 if(!raw)throw Error("Missing disposable database connection");
 const url=new URL(raw);
 if(url.protocol!=="postgresql:"||url.hostname!=="127.0.0.1"||
  url.port!=="5432"||url.username!=="masjid_ci"||
  url.pathname!=="/"+dbName||url.search||url.hash)
  throw Error("Restore rehearsal cannot operate outside exact disposable localhost databases.");
 return raw;
}
if(process.env.GITHUB_ACTIONS!=="true"||
 process.env.NODE_ENV==="production"||process.env.VERCEL)
 throw Error("Refusing restore verification outside GitHub Actions disposable CI.");
const sourceUrl=checkedUrl(process.env.DATABASE_URL,"masjid_ci");
const targetUrl=checkedUrl(process.env.SILA_RESTORE_DATABASE_URL,"masjid_ci_restore");
if(sourceUrl===targetUrl)throw Error("Restore destination must differ from source");
const source=new PrismaClient({datasources:{db:{url:sourceUrl}}});
const restored=new PrismaClient({datasources:{db:{url:targetUrl}}});
const fixture=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const models=[
 "organization","venue","user","authSession","organizationMembership",
 "roleGrant","student","guardianLink","schoolProgram","classSection",
 "classSession","attendance","enrollment","enrollmentApplication",
 "teacherAssignment","studentSubmission","studentReport","schoolInvoice",
 "paymentEvent","donation","donationCampaign","paymentReceipt",
 "journalEntry","journalLine","notification","outboxEvent","userPreference",
 "organizationDeliveryPreference","schoolWaitlist","deletionRequest",
 "auditEvent","careRequest","careCaseAccess","staffInvitation",
 "providerPayout","payoutReviewNote"
];
try{
 const migrations=await source.$queryRaw`
  SELECT migration_name,checksum FROM "_prisma_migrations"
  WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
  ORDER BY migration_name`;
 const restoredMigrations=await restored.$queryRaw`
  SELECT migration_name,checksum FROM "_prisma_migrations"
  WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
  ORDER BY migration_name`;
 const repositoryMigrations=readdirSync(new URL("../prisma/migrations/",import.meta.url),
  {withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>e.name).sort();
 assert.ok(repositoryMigrations.length>=10,"CI expected actual schema migrations");
 assert.deepEqual(migrations.map(m=>m.migration_name),repositoryMigrations,
  "Every checked-in migration must be recorded as applied in the backup source");
 assert.deepEqual(restoredMigrations,migrations,
  "restore must preserve every applied migration and checksum");
 const sourceCounts={};
 for(const name of models){
  const a=await source[name].count(),b=await restored[name].count();
  assert.equal(b,a,"Restored model count differs: "+name);
  sourceCounts[name]=a;
 }
 for(const model of ["organization","venue","user","guardianLink",
  "schoolInvoice","classSession","attendance","notification","outboxEvent"]){
  assert.ok(sourceCounts[model]>0,"CI restore must verify populated "+model);
 }
 const member=await source.user.findUniqueOrThrow({where:{email:fixture.memberEmail}});
 const restoredMember=await restored.user.findUniqueOrThrow({where:{email:fixture.memberEmail}});
 assert.equal(restoredMember.id,member.id);
 assert.equal(restoredMember.passwordHash,member.passwordHash,
  "even sensitive account material must survive recovery without being exposed in logs");
 const org=await source.organization.findFirstOrThrow({orderBy:{createdAt:"asc"}});
 const copyOrg=await restored.organization.findUniqueOrThrow({where:{id:org.id}});
 assert.equal(copyOrg.slug,org.slug);
 assert.equal(copyOrg.timeZone,org.timeZone);
 const guardian=await source.guardianLink.findFirstOrThrow({where:{
  guardianId:member.id,approvedAt:{not:null},revokedAt:null
 },include:{student:true}});
 const restoredGuardian=await restored.guardianLink.findUniqueOrThrow({
  where:{guardianId_studentId:{guardianId:member.id,studentId:guardian.studentId}},
  include:{student:true}
 });
 assert.equal(restoredGuardian.student.id,guardian.student.id);
 assert.equal(restoredGuardian.approvedAt?.toISOString(),
  guardian.approvedAt?.toISOString(),"private guardian approval timestamps must survive");
 const invoice=await source.schoolInvoice.findFirstOrThrow({where:{
  organizationId:org.id
 }});
 const recoveredInvoice=await restored.schoolInvoice.findUniqueOrThrow({
  where:{id:invoice.id}
 });
 assert.equal(recoveredInvoice.amountMinor,invoice.amountMinor);
 assert.equal(recoveredInvoice.status,invoice.status);
 const sourceOutbox=await source.outboxEvent.findFirstOrThrow({include:{notification:true}});
 const copiedOutbox=await restored.outboxEvent.findUniqueOrThrow({where:{id:sourceOutbox.id},
  include:{notification:true}});
 assert.equal(copiedOutbox.status,sourceOutbox.status);
 assert.equal(copiedOutbox.notification.body,sourceOutbox.notification.body);
 assert.equal(copiedOutbox.notification.organizationId,sourceOutbox.notification.organizationId);
 assert.equal(copiedOutbox.attempts,sourceOutbox.attempts);
 // Prove actual restored constraints, rather than comparing only row counts.
 await assert.rejects(restored.notification.create({data:{
  userId:"missing-restore-identity",organizationId:org.id,
  title:"Invalid foreign key",body:"Never persists."
 }}),e=>e?.code==="P2003","Restored foreign keys remain active");
 const marker="evt_ci_restored_"+randomUUID().replaceAll("-","");
 const inserted=await restored.paymentEvent.create({data:{
  providerEventId:marker,type:"restore.synthetic.replay"
 }});
 await assert.rejects(restored.paymentEvent.create({data:{
  providerEventId:marker,type:"restore.synthetic.replay"
 }}),e=>e?.code==="P2002",
 "Restored provider inbox still rejects replay of identical event IDs");
 assert.equal(await source.paymentEvent.count({where:{providerEventId:marker}}),0,
  "Writing restored event must not affect backup source DB");
 await restored.paymentEvent.delete({where:{id:inserted.id}});
 const notice=await restored.notification.create({data:{
  userId:member.id,organizationId:org.id,
  title:"Restored database isolation",body:"Synthetic local restore only"
 }});
 assert.equal(await source.notification.count({where:{id:notice.id}}),0,
  "Restored database cannot write to source");
 await restored.notification.delete({where:{id:notice.id}});
 assert.equal(await source.notification.count(),sourceCounts.notification);
 console.log("Verified logical restore of "+models.length+
  " model families and "+migrations.length+
  " migrations, confidential links, invoice/outbox continuity, FK and provider replay constraints, and source/restore isolation. Disposable CI only.");
}finally{
 await Promise.allSettled([source.$disconnect(),restored.$disconnect()]);
}
