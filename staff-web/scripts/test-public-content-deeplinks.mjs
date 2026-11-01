import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {PrismaClient} from "@prisma/client";

if(process.env.NODE_ENV==="production"||
   !process.env.DATABASE_URL?.includes("/masjid_ci")){
 throw Error("Refusing public content deep-link test outside disposable CI.");
}
const db=new PrismaClient();
const api="http://127.0.0.1:3000/api/v1/public/";
const suffix=randomUUID().replaceAll("-","");
const noticeIds=[];
const articleIds=[];
let foreign=null;
async function lookup(resource,id){
 const response=await fetch(api+resource+"?itemId="+encodeURIComponent(id),
  {cache:"no-store"});
 return {status:response.status,json:await response.json()};
}
try{
 const org=await db.organization.findFirst({
  orderBy:[{createdAt:"asc"},{id:"asc"}],select:{id:true}
 });
 assert.ok(org,"Disposable CI must seed the public mosque");
 foreign=await db.organization.create({data:{
  name:"Unrelated Synthetic Mosque",slug:"ci-content-"+suffix
 }});
 const past=new Date("2020-01-01T00:00:00.000Z");
 const future=new Date("2099-01-01T00:00:00.000Z");
 for(const resource of ["announcements","articles"]){
  const model=resource==="announcements"?db.announcement:db.communityArticle;
  const own=await model.create({data:{
   organizationId:org.id,title:"CI deep-link released "+suffix,body:"Approved public content",
   status:"published",publishedAt:past
  }});
  const draft=await model.create({data:{
   organizationId:org.id,title:"CI hidden draft "+suffix,body:"Do not share",
   status:"draft"
  }});
  const scheduled=await model.create({data:{
   organizationId:org.id,title:"CI scheduled "+suffix,body:"Do not share",
   status:"published",publishedAt:future
  }});
  const other=await model.create({data:{
   organizationId:foreign.id,title:"CI foreign tenant "+suffix,body:"Do not share",
   status:"published",publishedAt:past
  }});
  const ids=[own.id,draft.id,scheduled.id,other.id];
  if(resource==="announcements")noticeIds.push(...ids);else articleIds.push(...ids);
  const live=await lookup(resource,own.id);
  assert.equal(live.status,200,resource+" published deep link");
  assert.deepEqual(live.json.data.items.map(x=>x.id),[own.id]);
  assert.equal(live.json.data.items[0].body,"Approved public content");
  assert.equal(live.json.data.organization.id,org.id);
  for(const forbidden of [draft.id,scheduled.id,other.id,"notfound-"+suffix]){
   const response=await lookup(resource,forbidden);
   assert.equal(response.status,404,resource+" must deny "+forbidden);
   assert.ok(!JSON.stringify(response.json).includes("Do not share"));
  }
  for(const malformed of [
   api+resource+"?itemId=x",
   api+resource+"?itemId="+own.id+"&itemId="+draft.id,
   api+resource+"?itemId="+own.id+"&organizationId="+foreign.id
  ]){
   const response=await fetch(malformed);
   assert.equal(response.status,422,resource+" malformed or duplicate filter");
  }
 }
 console.log("Verified public notice/article direct IDs, older published content and draft/future/cross-tenant denial.");
}finally{
 if(noticeIds.length)await db.announcement.deleteMany({where:{id:{in:noticeIds}}});
 if(articleIds.length)await db.communityArticle.deleteMany({where:{id:{in:articleIds}}});
 if(foreign)await db.organization.deleteMany({where:{id:foreign.id}});
 await db.$disconnect();
}
