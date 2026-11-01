import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {PrismaClient} from "@prisma/client";

// Never create synthetic organizations or publish fixtures outside disposable CI.
if(process.env.NODE_ENV==="production" ||
 !process.env.DATABASE_URL?.includes("/masjid_ci") ||
 process.env.SILA_PUBLIC_INDEXING_ENABLED!=="true" ||
 process.env.SILA_PUBLIC_SITE_URL!=="http://127.0.0.1:3000"){
 throw Error("Refusing public-indexing smoke outside explicitly configured disposable CI.");
}
const base="http://127.0.0.1:3000";
const db=new PrismaClient();
const nonce=randomUUID().replaceAll("-","");
let temporaryOrgId=null;
let temporaryPublishedId=null;
let temporaryDraftId=null;
let temporaryFutureId=null;

try {
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"}});
 assert.ok(org,"CI bootstrap organization required");
 const [published,program,faith]=await Promise.all([
  db.event.findFirst({where:{organizationId:org.id,status:"published",endAt:{gte:new Date()}},select:{id:true}}),
  db.schoolProgram.findFirst({where:{organizationId:org.id,published:true},select:{id:true}}),
  db.faithNotice.findFirst({where:{organizationId:org.id,status:"published",
   approvedById:{not:null},publishedAt:{lte:new Date()}},select:{id:true}})
 ]);
 assert.ok(published&&program&&faith,"Expected approved public CI fixtures");

 // The indexing grant must never turn a foreign mosque's published record
 // into an authorized detail route or sitemap entry.
 const otherOrg=await db.organization.create({data:{
  slug:"ci-index-"+nonce,name:"CI INDEX FOREIGN MOSQUE"
 }});
 temporaryOrgId=otherOrg.id;
 const foreign=await db.event.create({data:{
  organizationId:otherOrg.id,title:"CI FOREIGN PUBLIC EVENT",
  description:"Not visible to this mosque's visitors",location:"Elsewhere",
  startAt:new Date(Date.now()+86400000),endAt:new Date(Date.now()+90000000),
  status:"published"
 }});
 temporaryPublishedId=foreign.id;
 const draft=await db.announcement.create({data:{
  organizationId:org.id,title:"CI PRIVATE INDEX DRAFT",
  body:"Must never be indexed",status:"draft"
 }});
 temporaryDraftId=draft.id;
 const future=await db.announcement.create({data:{
  organizationId:org.id,title:"CI FUTURE INDEX NOTICE",
  body:"Not yet approved for immediate display",status:"published",
  publishedAt:new Date(Date.now()+86400000*7)
 }});
 temporaryFutureId=future.id;

 const robotsResponse=await fetch(base+"/robots.txt",{cache:"no-store"});
 assert.equal(robotsResponse.status,200);
 const robots=await robotsResponse.text();
 assert.match(robots,/Disallow:\s*\//i,"private web application is blocked by default");
 assert.match(robots,/Allow:\s*\/visit/i,"approved visitor site can be discovered");
 assert.match(robots,/Sitemap:\s*http:\/\/127\.0\.0\.1:3000\/sitemap\.xml/i);
 assert.doesNotMatch(robots,/\/admin\b|\/api\/v1\/admin/i,
  "no private path should be promoted in public robots rules");

 const xmlResponse=await fetch(base+"/sitemap.xml",{cache:"no-store"});
 assert.equal(xmlResponse.status,200);
 const xml=await xmlResponse.text();
 for(const path of [
  "/visit",
  "/visit/content/gatherings/"+published.id,
  "/visit/content/learning/"+program.id,
  "/visit/content/faith/"+faith.id
 ]){
  assert.ok(xml.includes(base+path),"missing approved public path: "+path);
 }
 for(const id of [foreign.id,draft.id,future.id]) {
  assert.ok(!xml.includes(id),"unapproved, premature or foreign record entered public index: "+id);
 }
 assert.doesNotMatch(xml,/\/admin\/|\/api\/|\/schoolwork\/|\/kiosk\/|\/care\//);
 console.log("Public SEO controls: owner opt-in, published-only sitemap, cross-tenant and future/draft exclusion passed.");
} finally {
 if(temporaryDraftId)await db.announcement.deleteMany({where:{id:temporaryDraftId}});
 if(temporaryFutureId)await db.announcement.deleteMany({where:{id:temporaryFutureId}});
 if(temporaryPublishedId)await db.event.deleteMany({where:{id:temporaryPublishedId}});
 if(temporaryOrgId)await db.organization.deleteMany({where:{id:temporaryOrgId}});
 await db.$disconnect();
}
