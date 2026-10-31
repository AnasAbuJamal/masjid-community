// Format real shift instants in the MOSQUE's timezone, not the device's.
// The UTC fallback is intentionally labeled if a configured zone is invalid.
export function volunteerTime(instant:string,timeZone:string,language:"en"|"ar"):string{
 const date=new Date(instant);
 if(!Number.isFinite(date.getTime()))return language==="ar"?"وقت غير صالح":"Invalid time";
 try{
  return new Intl.DateTimeFormat(language==="ar"?"ar":"en-US",{
   timeZone,timeZoneName:"short",weekday:"short",year:"numeric",month:"short",
   day:"numeric",hour:"numeric",minute:"2-digit"
  }).format(date);
 }catch{
  return date.toISOString().replace("T"," ").slice(0,16)+" UTC";
 }
}
