import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {PrismaClient} from "@prisma/client";

if(process.env.NODE_ENV==="production"||
   !process.env.DATABASE_URL?.includes("/masjid_ci")){
 throw Error("Refusing contact intake integration outside disposable CI.");
}
const db=new PrismaClient();
const url="http://127.0.0.1:3000/api/v1/contact";
const marker=randomUUID().replaceAll("-","");
const email="synthetic-"+marker+"@ci.invalid";
let foreignOrg=null;
async function submit(body,origin="http://127.0.0.1:3000"){
 const response=await fetch(url,{
  method:"POST",headers:{"Origin":origin,"Content-Type":"application/json"},
  body:JSON.stringify(body)
 });
 return {status:response.status,body:await response.json()};
}
const payload={
 name:"Synthetic CI visitor",email,subject:"Synthetic contact integration",
 message:"This is a synthetic integration message, not a real mosque request.",
 website:""
};
try{
 const primary=await db.organization.findFirst({
  orderBy:{createdAt:"asc"},select:{id:true}
 });
 assert.ok(primary,"Seeded disposable CI mosque is required.");
 foreignOrg=await db.organization.create({data:{
  name:"CI other mosque",slug:"ci-contact-"+marker,
  createdAt:new Date("2099-01-01T00:00:00.000Z")
 }});

 const deniedOrigin=await submit(payload,"https://untrusted.example");
 assert.equal(deniedOrigin.status,403,"untrusted browser origins must be denied");
 assert.equal(await db.contactSubmission.count({where:{email}}),0);

 const invalid=await submit({...payload,message:"too short"});
 assert.equal(invalid.status,422,"message minimum is server enforced");
 assert.equal(await db.contactSubmission.count({where:{email}}),0);

 const honeypot=await submit({...payload,website:"untrusted bot"});
 assert.equal(honeypot.status,200,"honeypot suppresses bot writes");
 assert.equal(await db.contactSubmission.count({where:{email}}),0);

 const good=await submit(payload);
 assert.equal(good.status,201);
 assert.equal(good.body?.data?.received,true,
  "real success must supply the expected confirmed receipt");
 const saved=await db.contactSubmission.findMany({
  where:{email},select:{id:true,organizationId:true,name:true,message:true}
 });
 assert.equal(saved.length,1,"exactly one contact request must be recorded");
 assert.equal(saved[0].organizationId,primary.id,
  "submission belongs to the same pilot mosque as public home");
 assert.equal(saved[0].name,payload.name);
 assert.equal(saved[0].message,payload.message);

 const duplicate=await submit(payload);
 assert.equal(duplicate.status,429,"rapid repeated submission is rate limited");
 assert.equal(await db.contactSubmission.count({where:{email}}),1);
 console.log("Verified pilot contact intake receipt, origin, schema, honeypot, rate limit and tenant.");
}finally{
 await db.contactSubmission.deleteMany({where:{email}});
 if(foreignOrg)await db.organization.deleteMany({where:{id:foreignOrg.id}});
 await db.$disconnect();
}
