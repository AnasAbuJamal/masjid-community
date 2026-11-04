/** USD input is an exact decimal, never a rounded floating-point estimate. */
export function monthlyAmount(input:string):number|null{
 if(!/^(0|[1-9]\d{0,5})(?:\.\d{1,2})?$/.test(input))return null;
 const [whole,fraction=""]=input.split(".");
 const minor=Number(whole)*100+Number(fraction.padEnd(2,"0"));
 return minor>=100&&minor<=10000000?minor:null;
}
export type GiftStatus="pending"|"active"|"past_due"|"cancelled"|"failed"|"incomplete"|"paused";
export type Gift={id:string;campaign:{id:string;title:string};amountMinor:number;currency:string;status:GiftStatus;cancelRequestedAt:string|null;createdAt:string};
export type GivingOrganization={id:string;name:string;timeZone:string};
export type GiftsResponse={enabled:boolean;organization:GivingOrganization;items:Gift[];nextCursor:string|null};
export type GiftHistory={enabled:boolean;organization:GivingOrganization;gift:Gift;installments:{invoiceId:string;status:string;amountMinor:number;currency:string;createdAt:string;receiptId:string|null}[];nextCursor:string|null};
export function givingMoney(amountMinor:number,currency:string,language:"en"|"ar"){
 return new Intl.NumberFormat(language==="ar"?"ar-EG":"en-US",{style:"currency",currency}).format(amountMinor/100);
}
export function recurringPath(giftId:string|null,cursor:string){
 const query=[giftId?"giftId="+encodeURIComponent(giftId):"",cursor?"cursor="+encodeURIComponent(cursor):""].filter(Boolean).join("&");
 return "donations/recurring"+(query?"?"+query:"");
}
const statusKeys={pending:"giving.status.pending",active:"giving.status.active",past_due:"giving.status.past_due",cancelled:"giving.status.cancelled",failed:"giving.status.failed",incomplete:"giving.status.incomplete",paused:"giving.status.paused"} as const;
export function giftStatusKey(status:string){
 return Object.hasOwn(statusKeys,status)?statusKeys[status as GiftStatus]:"giving.status.unknown";
}
export function hasFinalGivingReceipt(invoice:{status:string;receiptId:string|null}){
 return (invoice.status==="paid"||invoice.status==="refunded")&&typeof invoice.receiptId==="string"&&invoice.receiptId.trim().length>0;
}
export function cancellationOutcome(giftId:string,response:{giftId:string;status:string;cancelled:boolean;pending:boolean}):"cancelled"|"pending"|null{
 if(response.giftId!==giftId)return null;
 if(response.cancelled===true&&response.status==="cancelled"&&response.pending===false)return "cancelled";
 if(response.cancelled===false&&response.status!=="cancelled"&&response.pending===true)return "pending";
 return null;
}
