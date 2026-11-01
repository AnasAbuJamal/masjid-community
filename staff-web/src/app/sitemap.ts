import type {MetadataRoute} from "next";
import {db} from "@/lib/db";
import {publicIndexOrigin,publicIndexPath} from "@/lib/public-indexing";

export const dynamic = "force-dynamic";

// The guest site is intentionally scoped to the currently configured mosque.
// Never include members, care cases, contributions or unpublished records.
// The limits bound crawler load until a reviewed segmented-sitemap lifecycle.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 const origin=publicIndexOrigin(process.env.SILA_PUBLIC_INDEXING_ENABLED,
   process.env.SILA_PUBLIC_SITE_URL);
 if (!origin) return [];
 const organization=await db.organization.findFirst({
  orderBy:{createdAt:"asc"}, select:{id:true}
 });
 if (!organization) return [];

 const now=new Date();
 const organizationId=organization.id;
 const [gatherings,updates,learning,faith]=await Promise.all([
  db.event.findMany({
   where:{organizationId,status:"published",endAt:{gte:now}},
   orderBy:[{startAt:"asc"},{id:"asc"}],take:400,select:{id:true}
  }),
  db.announcement.findMany({
   where:{organizationId,status:"published",publishedAt:{lte:now}},
   orderBy:[{publishedAt:"desc"},{id:"asc"}],take:400,select:{id:true}
  }),
  db.schoolProgram.findMany({
   where:{organizationId,published:true},
   orderBy:{id:"asc"},take:400,select:{id:true}
  }),
  db.faithNotice.findMany({
   where:{organizationId,status:"published",approvedById:{not:null},
    publishedAt:{lte:now}},
   orderBy:[{localDate:"desc"},{id:"asc"}],take:400,select:{id:true}
  })
 ]);
 const entries:MetadataRoute.Sitemap=[{
  url:origin+"/visit",changeFrequency:"daily",priority:1
 }];
 for(const [kind,rows] of [
  ["gatherings",gatherings],["updates",updates],
  ["learning",learning],["faith",faith]
 ] as const){
  for(const item of rows){
   const path=publicIndexPath(kind,item.id);
   if(path)entries.push({url:origin+path,changeFrequency:"weekly",priority:0.6});
  }
 }
 return entries;
}
