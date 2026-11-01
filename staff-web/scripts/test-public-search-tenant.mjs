import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {PrismaClient} from "@prisma/client";

if(process.env.NODE_ENV==="production"||
 !process.env.DATABASE_URL?.includes("/masjid_ci")){
 throw Error("Refusing guest-search HTTP integration outside disposable CI.");
}

const db=new PrismaClient();
const id=randomUUID().replaceAll("-","");
const term="CISearch"+id;
const base="http://127.0.0.1:3000/api/v1/public/search";
let foreign=null;
const articleIds=[];
async function get(search){
 const response=await fetch(base+search,{cache:"no-store"});
 return {status:response.status,payload:await response.json()};
}

try{
 const pilot=await db.organization.findFirst({
  orderBy:{createdAt:"asc"},select:{id:true}
 });
 assert.ok(pilot,"The disposable CI primary mosque must exist.");
 foreign=await db.organization.create({data:{
  name:"Synthetic other mosque",slug:"ci-search-"+id,
  createdAt:new Date("2099-01-01T00:00:00.000Z")
 }});
 const past=new Date("2020-01-01T00:00:00.000Z");
 const future=new Date("2099-01-01T00:00:00.000Z");
 for(const data of [
  {organizationId:pilot.id,title:term+" released in pilot",status:"published",publishedAt:past},
  {organizationId:pilot.id,title:term+" draft",status:"draft",publishedAt:null},
  {organizationId:pilot.id,title:term+" future",status:"published",publishedAt:future},
  {organizationId:foreign.id,title:term+" other mosque",status:"published",publishedAt:past}
 ]){
  const article=await db.communityArticle.create({data:{
   ...data,body:"Synthetic search data, no personal information."
  }});
  articleIds.push(article.id);
 }
 const result=await get("?q="+encodeURIComponent(term)+"&kind=articles");
 assert.equal(result.status,200);
 assert.deepEqual(result.payload.data.items.map(x=>x.id),[articleIds[0]],
  "public search may show only currently released primary-mosque content");
 assert.equal(result.payload.data.items[0].kind,"articles");
 const all=await get("?q="+encodeURIComponent(term)+"&kind=all");
 assert.equal(all.status,200);
 assert.deepEqual(all.payload.data.items.map(x=>x.id),[articleIds[0]]);

 for(const suffix of [
  "?q="+term+"&q="+term,
  "?q="+term+"&kind=articles&kind=all",
  "?q="+term+"&organizationId="+foreign.id,
  "?q="+term+"&kind=private",
  "?q="+encodeURIComponent("<script>")
 ]){
  const response=await get(suffix);
  assert.equal(response.status,422,"malformed or ambiguous guest filters are refused");
 }
 console.log("Verified deterministic pilot search, published-only isolation and strict query filters.");
}finally{
 if(articleIds.length)
  await db.communityArticle.deleteMany({where:{id:{in:articleIds}}});
 if(foreign)await db.organization.deleteMany({where:{id:foreign.id}});
 await db.$disconnect();
}
