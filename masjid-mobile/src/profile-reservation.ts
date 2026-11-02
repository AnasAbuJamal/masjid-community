import {isGatheringDeadlineClosed} from "./gathering-deadline";
import type {TranslationKey} from "./i18n";

/** A private dashboard may only describe server-known reservation states.
 * Unknown legacy values cannot silently become a confirmed reservation.
 */
export function profileReservationLabelKey(
 status:string,checkedInAt:string|null|undefined
):TranslationKey{
 if(checkedInAt||status==="checked_in")return "profile.reservationCheckedIn";
 if(status==="waitlisted")return "profile.reservationWaitlisted";
 if(status==="confirmed")return "profile.reservationConfirmed";
 return "profile.reservationUnverified";
}

/** This is only a presentation guard; the member-owned server DELETE
 * enforces membership, checked-in state and the current cancellation cutoff.
 */
export function canOfferProfileCancellation(
 status:string,checkedInAt:string|null|undefined,
 startAt:string|null|undefined,cancellationDeadlineAt:string|null|undefined,
 nowMs:number=Date.now()
):boolean{
 if(checkedInAt||!["confirmed","waitlisted"].includes(status))return false;
 // An explicit cancellation deadline can never extend past the event start.
 if(isGatheringDeadlineClosed(startAt,nowMs))return false;
 return !isGatheringDeadlineClosed(cancellationDeadlineAt||startAt,nowMs);
}
