import type {TranslationKey} from "./i18n";

/**
 * Only known server states are presented as verified facts. In particular,
 * a facility "requested" state is NOT a booking, and a payment "pending"
 * state is NOT a settled contribution or issued receipt.
 */
export type ProfileStatusDomain="payment"|"booking"|"application";
const labels:Record<ProfileStatusDomain,Record<string,TranslationKey>>={
 payment:{
  pending:"profile.paymentPending",
  paid:"profile.paymentPaid",
  failed:"profile.paymentFailed",
  refunded:"profile.paymentRefunded"
 },
 booking:{
  requested:"profile.bookingRequested",
  approved:"profile.bookingApproved",
  cancelled:"profile.bookingCancelled",
  rejected:"profile.bookingRejected"
 },
 application:{
  submitted:"profile.applicationSubmitted",
  approved:"profile.applicationApproved",
  declined:"profile.applicationDeclined",
  withdrawn:"profile.applicationWithdrawn"
 }
};
export function profileStatusLabelKey(
 domain:ProfileStatusDomain,status:string
):TranslationKey{
 // Unknown values (including inherited Object.prototype keys) must not
 // become trusted translation keys or crash the member dashboard.
 return Object.prototype.hasOwnProperty.call(labels[domain],status)
  ?labels[domain][status]:"profile.statusUnverified";
}
