/**
 * Strict, locale-independent calendar navigation for a mosque-published civil
 * prayer day. Never use the device's timezone as a substitute for an invalid
 * venue timezone, and never reinterpret the returned YYYY-MM-DD as an instant.
 */
function validCivilDate(key:string):Date|null{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(key)||Number(key.slice(0,4))<1)return null;
 const day=new Date(key+"T12:00:00.000Z");
 return Number.isFinite(day.getTime())&&day.toISOString().slice(0,10)===key
  ?day:null;
}

export function venueLocalCivilDay(
 zone:string|null|undefined,
 now:Date=new Date()
):string|null{
 if(!zone||!Number.isFinite(now.getTime()))return null;
 try{
  const parts=new Intl.DateTimeFormat("en-US-u-ca-gregory",{
   timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"
  }).formatToParts(now);
  const component=(key:string)=>parts.find(p=>p.type===key)?.value;
  const y=component("year"),m=component("month"),d=component("day");
  if(!y||!m||!d)return null;
  const key=y.padStart(4,"0")+"-"+m+"-"+d;
  return validCivilDate(key)?key:null;
 }catch{return null;}
}

export function shiftPublishedCivilDay(
 key:string,delta:-1|1
):string|null{
 const day=validCivilDate(key);
 if(!day)return null;
 day.setUTCDate(day.getUTCDate()+delta);
 const next=day.toISOString().slice(0,10);
 return validCivilDate(next)?next:null;
}

/** Do not pass an old venue's manually selected date to a new venue's API. */
export function selectedVenuePrayerDay(
 selection:{venueId:string;localDate:string}|null,
 currentVenueId:string|null|undefined
):string|null{
 if(!selection||!currentVenueId||selection.venueId!==currentVenueId)return null;
 return validCivilDate(selection.localDate)?selection.localDate:null;
}
