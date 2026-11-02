/** Strict user-entered local quiet hours for optional email only.
 * These are civil clock hours at the server-confirmed mosque timezone; no
 * conversion to the device timezone or claim of a delivery guarantee.
 */
export type EmailQuietHours={
 quietStartHour:number|null;
 quietEndHour:number|null;
};
const hour=/^(?:[0-9]|1[0-9]|2[0-3])$/;
export function parseEmailQuietHours(
 enabled:boolean,startText:string,endText:string
):EmailQuietHours|null{
 if(!enabled)return {quietStartHour:null,quietEndHour:null};
 const start=startText.trim(),end=endText.trim();
 if(!hour.test(start)||!hour.test(end))return null;
 const from=Number(start),until=Number(end);
 if(from===until)return null;
 return {quietStartHour:from,quietEndHour:until};
}
