// Local only. Do not run in production or Vercel.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const db=new PrismaClient();
async function main() {
 if(process.env.NODE_ENV==="production"||process.env.VERCEL)throw new Error("Production bootstrap is prohibited.");
 const email=process.env.ADMIN_EMAIL?.toLowerCase().trim(),password=process.env.ADMIN_PASSWORD;
 if(!email||!password||password.length<16)throw new Error("Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of 16+ characters.");
 await db.organization.upsert({where:{slug:"masjid-al-momineen"},update:{},create:{
   slug:"masjid-al-momineen",name:"Masjid Al-Momineen",timeZone:"America/New_York",
   venues:{create:{name:"Main Prayer Hall",timeZone:"America/New_York"}}
 }});
 await db.user.upsert({where:{email},update:{},create:{
  email,firstName:"Local",lastName:"Administrator",role:"admin",verifiedAt:new Date(),passwordHash:await bcrypt.hash(password,12),
 }});
 console.log("Local organization and admin ready. No public schedule or test payment data was invented.");
}
main().finally(()=>db.$disconnect());
