import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireMemberContext} from "@/lib/auth";
import {handled,HttpError,ok} from "@/lib/http";

const kinds=["all","events","announcements","articles"] as const;
type Kind=typeof kinds[number];
// F-007/F-048 selected-mosque *published-only* discovery. Native category
// display never authorizes more data than the verified server session.
export async function GET(req:NextRequest){
 return handled(async()=>{
  const {org}=await requireMemberContext(req);
  const params=req.nextUrl.searchParams;
  if([...params.keys()].some(k=>k!=="q"&&k!=="kind")||
   params.getAll("q").length!==1||params.getAll("kind").length>1)
   throw new HttpError(422,"BAD_QUERY","Exactly one query and at most one category are supported.");
  const q=z.string().trim().min(2).max(80)
   .regex(/^[\p{L}\p{N}\s.'’\-]+$/u,"Use letters, numbers and spaces.")
   .parse(params.get("q"));
  const kind=z.enum(kinds).parse(params.get("kind")||"all");
  const yes=(category:Kind)=>kind==="all"||kind===category;
  const text={contains:q,mode:"insensitive" as const};
  const now=new Date(),take=6;
  const [events,announcements,articles]=await Promise.all([
   yes("events")?db.event.findMany({where:{
    organizationId:org.id,status:"published",startAt:{gte:now},
    OR:[{title:text},{description:text},{location:text}]
   },take,orderBy:[{startAt:"asc"},{id:"asc"}],
    select:{id:true,title:true,description:true}}):[],
   yes("announcements")?db.announcement.findMany({where:{
    organizationId:org.id,status:"published",publishedAt:{lte:now},
    OR:[{title:text},{body:text}]
   },take,orderBy:[{publishedAt:"desc"},{id:"asc"}],
    select:{id:true,title:true,body:true}}):[],
   yes("articles")?db.communityArticle.findMany({where:{
    organizationId:org.id,status:"published",publishedAt:{lte:now},
    OR:[{title:text},{body:text}]
   },take,orderBy:[{publishedAt:"desc"},{id:"asc"}],
    select:{id:true,title:true,body:true}}):[]
  ]);
  const items=[
   ...events.map(x=>({kind:"events",id:x.id,title:x.title,description:x.description.slice(0,240)})),
   ...announcements.map(x=>({kind:"announcements",id:x.id,title:x.title,description:x.body.slice(0,240)})),
   ...articles.map(x=>({kind:"articles",id:x.id,title:x.title,description:x.body.slice(0,240)}))
  ];
  return ok({query:q,kind,organization:{id:org.id,name:org.name},
   items,note:"Published content in your currently selected mosque; at most six results per category."});
 });
}
