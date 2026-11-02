/**
 * Client-side facility booking input validation.
 *
 * Require a full civil date/time AND an explicit UTC offset. A time typed
 * without an offset (such as during a fall-back DST hour) is ambiguous and
 * must not silently inherit the phone's timezone.
 *
 * The API remains authoritative on availability, future-date checks, the
 * seven-day maximum, eligibility, booking state and approval.
 */
const explicitTime=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|([+-])(\d{2}):(\d{2}))$/;
export function canonicalRentalInstant(value:string):string|null{
 const input=value.trim(),m=explicitTime.exec(input);
 if(!m)return null;
 const year=Number(m[1]),month=Number(m[2]),day=Number(m[3]),
  hour=Number(m[4]),minute=Number(m[5]),second=Number(m[6]),
  millisecond=Number((m[7]||"").padEnd(3,"0"));
 if(year<100||year>9999)return null;
 if(m[9]&&(Number(m[10])>23||Number(m[11])>59))return null;
 const civil=new Date(Date.UTC(year,month-1,day,hour,minute,second,millisecond));
 if(!Number.isFinite(civil.getTime())||
  civil.getUTCFullYear()!==year||civil.getUTCMonth()+1!==month||
  civil.getUTCDate()!==day||civil.getUTCHours()!==hour||
  civil.getUTCMinutes()!==minute||civil.getUTCSeconds()!==second||
  civil.getUTCMilliseconds()!==millisecond)return null;
 const parsed=new Date(input);
 if(!Number.isFinite(parsed.getTime()))return null;
 return parsed.toISOString();
}
export type RentalRangeResult=
 |{valid:true;startAt:string;endAt:string}
 |{valid:false;problem:"invalid"|"order"|"tooLong"};
export function canonicalRentalRange(from:string,to:string):RentalRangeResult{
 const startAt=canonicalRentalInstant(from),endAt=canonicalRentalInstant(to);
 if(!startAt||!endAt)return {valid:false,problem:"invalid"};
 const interval=Date.parse(endAt)-Date.parse(startAt);
 if(interval<=0)return {valid:false,problem:"order"};
 if(interval>7*86_400_000)return {valid:false,problem:"tooLong"};
 return {valid:true,startAt,endAt};
}
