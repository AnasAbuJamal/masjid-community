import type {DeliveryPurpose} from "@prisma/client";

type OptionalPurpose=Exclude<DeliveryPurpose,"service">;
export const optionalDeliveryPurposes=["event_updates","community_news"] as const satisfies readonly OptionalPurpose[];
export type DeliveryDecision=
 {kind:"deliver"}|{kind:"suppress";reason:"opt_in_required"}|{kind:"defer";nextAt:Date};
export type ConsentPolicy={
 enabled:boolean;consentedAt:Date|null;quietStartHour:number|null;quietEndHour:number|null
};

// Optional messages have no inferred consent. Legacy user-global settings
// must NEVER supply authorization for one mosque's contact with its member.
export function evaluateEmailDelivery(
 purpose:DeliveryPurpose,
 preference:ConsentPolicy|null,
 timeZone:string,
 now:Date
):DeliveryDecision{
 if(purpose==="service")return {kind:"deliver"};
 if(!optionalDeliveryPurposes.includes(purpose)||!preference?.enabled||!preference.consentedAt)
  return {kind:"suppress",reason:"opt_in_required"};
 const {quietStartHour:start,quietEndHour:end}=preference;
 if(start===null||end===null)return {kind:"deliver"};
 if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||start>23||
  end<0||end>23||start===end)return {kind:"suppress",reason:"opt_in_required"};
 const hour=(date:Date)=>Number(new Intl.DateTimeFormat("en-GB",{
  hour:"2-digit",hourCycle:"h23",timeZone
 }).format(date));
 const quiet=(date:Date)=>{
  const local=hour(date);
  return start<end?(local>=start&&local<end):(local>=start||local<end);
 };
 // Scan real instants rather than subtracting local wall-clock time. This
 // respects DST skipped/repeated hours in each mosque's IANA timezone.
 if(!quiet(now))return {kind:"deliver"};
 const resolution=15*60_000;
 for(let i=1;i<=100;i++){
  const candidate=new Date(now.getTime()+i*resolution);
  if(!quiet(candidate))return {kind:"defer",nextAt:candidate};
 }
 // Fail safe when no real wall-clock exit is discoverable in 25 hours.
 return {kind:"suppress",reason:"opt_in_required"};
}
