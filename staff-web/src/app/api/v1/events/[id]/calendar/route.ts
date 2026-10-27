import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {handled,HttpError} from "@/lib/http";

type Context={params:Promise<{id:string}>};

function calendarDate(date:Date){
 return date.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
}
function escapeCal(value:string){
 return value.replace(/\\/g,"\\\\").replace(/\r\n|\r|\n/g,"\\n").replace(/;/g,"\\;").replace(/,/g,"\\,");
}
function folded(input:string){
 let parts:string[]=[];
 for(const line of input.split("\r\n")){
  let built="",length=0;
  for(const letter of line){
   const width=Buffer.byteLength(letter,"utf8");
   if(length+width>75&&built){
    parts.push(built);
    built=" ";length=1;
   }
   built+=letter;length+=width;
  }
  parts.push(built);
 }
 return parts.join("\r\n");
}

// This is an informational event download, NOT a confirmed reservation.
// Only organization-scoped published events can be exported.
export async function GET(_req:NextRequest,{params}:Context){
 return handled(async()=>{
  const {id}=await params;
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(404,"NOT_FOUND","Event unavailable.");
  const event=await db.event.findFirst({where:{id,organizationId:org.id,status:"published"},
   select:{id:true,title:true,description:true,location:true,startAt:true,endAt:true}});
  if(!event)throw new HttpError(404,"NOT_FOUND","Event unavailable.");
  const lines=[
   "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//SILA//Public gatherings//EN",
   "CALSCALE:GREGORIAN","BEGIN:VEVENT",
   "UID:"+event.id+"@events.sila.invalid",
   "DTSTAMP:"+calendarDate(new Date()),
   "DTSTART:"+calendarDate(event.startAt),
   "DTEND:"+calendarDate(event.endAt),
   "SUMMARY:"+escapeCal(event.title),
   "DESCRIPTION:"+escapeCal(event.description+"\nCalendar entry only. This does not reserve a place."),
   "LOCATION:"+escapeCal(event.location),
   "END:VEVENT","END:VCALENDAR"
  ];
  return new NextResponse(folded(lines.join("\r\n"))+"\r\n",{
   status:200,headers:{
    "Content-Type":"text/calendar; charset=utf-8",
    "Content-Disposition":'attachment; filename="sila-gathering.ics"',
    "Cache-Control":"no-store","X-Content-Type-Options":"nosniff"
   }
  });
 });
}
