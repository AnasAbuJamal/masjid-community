import {NextResponse} from "next/server";

// The ICS is informational only. NEVER include attendees, reservations,
// personal email addresses or an implied confirmed seat in any calendar file.
function calendarDate(date:Date){
 return date.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
}
function escapeCal(value:string){
 return value.replace(/\\/g,"\\\\").replace(/\r\n|\r|\n/g,"\n").replace(/;/g,"\\;").replace(/,/g,"\\,");
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


export type ExportableEvent={
 id:string;title:string;description:string;location:string;
 startAt:Date;endAt:Date;
};
export function calendarResponse(event:ExportableEvent):NextResponse{
 const lines=[
  "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//SILA//Published gatherings//EN",
  "CALSCALE:GREGORIAN","BEGIN:VEVENT",
  "UID:"+event.id+"@events.sila.invalid",
  "DTSTAMP:"+calendarDate(new Date()),
  "DTSTART:"+calendarDate(event.startAt),
  "DTEND:"+calendarDate(event.endAt),
  "SUMMARY:"+escapeCal(event.title),
  "DESCRIPTION:"+escapeCal(event.description+
    "\nCalendar entry only. This does not reserve a place."),
  "LOCATION:"+escapeCal(event.location),
  "END:VEVENT","END:VCALENDAR"
 ];
 return new NextResponse(folded(lines.join("\r\n"))+"\r\n",{
  status:200,headers:{
   "Content-Type":"text/calendar; charset=utf-8",
   "Content-Disposition":'attachment; filename="sila-gathering.ics"',
   "Cache-Control":"private, no-store","Vary":"Authorization, Cookie",
   "X-Content-Type-Options":"nosniff"
  }
 });
}
