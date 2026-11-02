import {isGatheringDeadlineClosed} from "./gathering-deadline.ts";
import type {TranslationKey} from "./i18n";

/** Require an unambiguous server timestamp, not a date-only or device-local string. */
function hasVerifiedCheckInTimestamp(value:string|null|undefined):boolean{
 if(!value||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value))return false;
 return Number.isFinite(Date.parse(value));
}

/** A private dashboard may only describe server-known reservation states.
 * Unknown legacy values cannot silently become a confirmed reservation.
 */
export function profileReservationLabelKey(
 status:string,checkedInAt:string|null|undefined
):TranslationKey{
 // A timestamp alone must not override a contradictory or unknown RSVP state.
 if((status==="confirmed"||status==="checked_in")&&hasVerifiedCheckInTimestamp(checkedInAt))return "profile.reservationCheckedIn";
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
