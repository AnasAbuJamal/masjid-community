import {NextRequest} from "next/server";
import {db} from "@/lib/db";
import {handled,HttpError,ok} from "@/lib/http";
const kinds=["events","articles","announcements","programs","jobs","campaigns","volunteers","construction","rentals","proposals"] as const;
type Kind=typeof kinds[number];
export async function GET(req:NextRequest){
 return handled(async()=>{
  const q=(req.nextUrl.searchParams.get("q")||"").trim();
  const category=req.nextUrl.searchParams.get("kind")||"all";
  if(category!=="all"&&!kinds.includes(category as Kind))
   throw new HttpError(422,"INVALID_CATEGORY","Choose a supported search category.");
  if(q.length<2)return ok({query:q,kind:category,items:[]});
  if(q.length>80||!(/^[\p{L}\p{N}\s.'’\-]+$/u.test(q)))
   throw new HttpError(422,"INVALID_QUERY","Use 2 to 80 letters, numbers or spaces.");
  const org=await db.organization.findFirst();
  if(!org)return ok({query:q,kind:category,items:[]});
  const id=org.id,now=new Date(),take=6;
  const yes=(kind:Kind)=>category==="all"||category===kind;
  const text={contains:q,mode:"insensitive" as const};
  const [events,articles,announcements,programs,jobs,campaigns,volunteers,construction,rentals,proposals]=await Promise.all([
   yes("events")?db.event.findMany({where:{organizationId:id,status:"published",startAt:{gte:now},OR:[{title:text},{description:text}]},take,
    orderBy:{startAt:"asc"},select:{id:true,title:true,description:true}}):[],
   yes("articles")?db.communityArticle.findMany({where:{organizationId:id,status:"published",publishedAt:{lte:now},OR:[{title:text},{body:text}]},take,
    orderBy:{publishedAt:"desc"},select:{id:true,title:true,body:true}}):[],
   yes("announcements")?db.announcement.findMany({where:{organizationId:id,status:"published",publishedAt:{lte:now},OR:[{title:text},{body:text}]},take,
    orderBy:{publishedAt:"desc"},select:{id:true,title:true,body:true}}):[],
   yes("programs")?db.schoolProgram.findMany({where:{organizationId:id,published:true,OR:[{title:text},{description:text}]},take,
    select:{id:true,title:true,description:true}}):[],
   yes("jobs")?db.jobPosting.findMany({where:{organizationId:id,status:"published",OR:[{title:text},{description:text},{company:text}]},take,
    select:{id:true,title:true,description:true}}):[],
   yes("campaigns")?db.donationCampaign.findMany({where:{organizationId:id,published:true,OR:[{title:text},{purpose:text}]},take,
    select:{id:true,title:true,purpose:true}}):[],
   yes("volunteers")?db.volunteerOpportunity.findMany({where:{organizationId:id,published:true,OR:[{title:text},{description:text}]},take,
    select:{id:true,title:true,description:true}}):[],
   yes("construction")?db.constructionProject.findMany({where:{organizationId:id,status:"published",OR:[{title:text},{description:text}]},take,
    select:{id:true,title:true,description:true}}):[],
   yes("rentals")?db.rentalResource.findMany({where:{organizationId:id,published:true,OR:[{title:text},{description:text}]},take,
    select:{id:true,title:true,description:true}}):[],
   yes("proposals")?db.proposal.findMany({where:{organizationId:id,status:"published",OR:[{title:text},{description:text}]},take,
    select:{id:true,title:true,description:true}}):[]
  ]);
  const normalized=(kind:Kind,items:{id:string;title:string;description?:string;body?:string;purpose?:string}[])=>items.map(x=>({
   kind,id:x.id,title:x.title,description:(x.description||x.body||x.purpose||"").slice(0,240)}));
  return ok({query:q,kind:category,items:[
   ...normalized("events",events),...normalized("articles",articles),
   ...normalized("announcements",announcements),...normalized("programs",programs),
   ...normalized("jobs",jobs),...normalized("campaigns",campaigns),
   ...normalized("volunteers",volunteers),...normalized("construction",construction),
   ...normalized("rentals",rentals),...normalized("proposals",proposals)
  ]});
 });
}
