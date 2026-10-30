// Convert an exact YYYY-MM-DD civil day at an IANA timezone to its real
// UTC start instant. Iterative Intl mapping accounts for 23/25-hour DST days.
// A skipped/unrepresentable local midnight returns null, never a guess.
export function civilDayStart(day:string,timeZone:string):Date|null{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return null;
 const year=Number(day.slice(0,4)),month=Number(day.slice(5,7)),date=Number(day.slice(8,10));
 if(year<1900||year>2101)return null;
 const nominal=Date.UTC(year,month-1,date);
 const parsed=new Date(nominal);
 if(parsed.getUTCFullYear()!==year||parsed.getUTCMonth()!==month-1||
  parsed.getUTCDate()!==date)return null;
 try{
  const formatter=new Intl.DateTimeFormat("en-US",{
   timeZone,year:"numeric",month:"2-digit",day:"2-digit",
   hour:"2-digit",minute:"2-digit",hourCycle:"h23"
  });
  let guess=nominal;
  for(let iteration=0;iteration<8;iteration++){
   const parts=formatter.formatToParts(new Date(guess));
   const num=(type:string)=>Number(parts.find(x=>x.type===type)?.value);
   const viewed=Date.UTC(num("year"),num("month")-1,num("day"),num("hour"),num("minute"));
   if(!Number.isFinite(viewed))return null;
   const delta=nominal-viewed;
   if(delta===0)return new Date(guess);
   guess+=delta;
  }
 }catch{/* Invalid IANA timezone; never synthesize a date. */}
 return null;
}
export function nextCivilDay(day:string):string|null{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return null;
 const date=new Date(day+"T12:00:00.000Z");
 if(!Number.isFinite(date.valueOf())||date.toISOString().slice(0,10)!==day)return null;
 date.setUTCDate(date.getUTCDate()+1);
 return date.toISOString().slice(0,10);
}
