// Timezone-safe, dependency-free civil clock conversion for steward scheduling.
// Reject both nonexistent (spring forward) and repeated (fall back) local times.
// This does not infer a timezone from the operator's phone or browser.
export type ResolvedLocalTime=
 |{ok:true;date:Date}
 |{ok:false;reason:"INVALID_LOCAL_TIME"|"INVALID_ZONE"|"NONEXISTENT_LOCAL_TIME"|"AMBIGUOUS_LOCAL_TIME"};
type Part="year"|"month"|"day"|"hour"|"minute";
function wallClockParts(date:Date,timeZone:string){
 const fmt=new Intl.DateTimeFormat("en-US",{
  timeZone,year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23"
 });
 const parts=fmt.formatToParts(date);
 const field=(part:Part)=>parts.find(x=>x.type===part)?.value||"";
 return [field("year"),field("month"),field("day")].join("-")+"T"+
  [field("hour"),field("minute")].join(":");
}
export function formatMosqueLocalInput(instant:string,timeZone:string):string{
 const date=new Date(instant);
 if(!Number.isFinite(date.valueOf()))return "";
 try{return wallClockParts(date,timeZone);}catch{return "";}
}
function offsetAt(date:Date,fmt:Intl.DateTimeFormat):number|null{
 const text=fmt.formatToParts(date).find(x=>x.type==="timeZoneName")?.value||"";
 if(text==="GMT"||text==="UTC")return 0;
 const match=/^(?:GMT|UTC)([+-])(\d{1,2})(?::(\d{2}))?$/.exec(text);
 if(!match)return null;
 const hours=Number(match[2]),minutes=Number(match[3]||"0");
 if(hours>14||minutes>59)return null;
 return (match[1]==="-"?-1:1)*(hours*60+minutes);
}
export function resolveMosqueLocalTime(local:string,timeZone:string):ResolvedLocalTime{
 const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
 if(!match)return {ok:false,reason:"INVALID_LOCAL_TIME"};
 const [year,month,day,hour,minute]=match.slice(1).map(Number);
 if(year<1000||month<1||month>12||hour>23||minute>59)
  return {ok:false,reason:"INVALID_LOCAL_TIME"};
 const naive=Date.UTC(year,month-1,day,hour,minute);
 const roundtrip=new Date(naive).toISOString().slice(0,16);
 if(roundtrip!==local)return {ok:false,reason:"INVALID_LOCAL_TIME"};
 try{
  const offsetFmt=new Intl.DateTimeFormat("en-US",{timeZone,timeZoneName:"shortOffset"});
  const offsets=new Set<number>();
  for(let hours=-36;hours<=36;hours+=3){
   const offset=offsetAt(new Date(naive+hours*3600_000),offsetFmt);
   if(offset===null)return {ok:false,reason:"INVALID_ZONE"};
   offsets.add(offset);
  }
  const valid=[...offsets].map(offset=>new Date(naive-offset*60_000))
   .filter(date=>wallClockParts(date,timeZone)===local);
  if(valid.length===0)return {ok:false,reason:"NONEXISTENT_LOCAL_TIME"};
  if(valid.length!==1)return {ok:false,reason:"AMBIGUOUS_LOCAL_TIME"};
  return {ok:true,date:valid[0]};
 }catch{return {ok:false,reason:"INVALID_ZONE"};}
}
