// Pure, device-independent kiosk public-version checks.
// All fields originate from published, unauthenticated guest responses.
export type KioskSnapshot={
 venueId:string|null;
 timeZone:string;
 localDay:string|null;
 prayerRevision:number|null;
 prayerUpdatedAt:string|null;
 emergencyId:string|null;
 emergencyRevision:number|null;
};
export type PublishedHome={
 venue?:{id:string}|null;
 prayer?:{revision:number;updatedAt:string;localDate:string}|null;
 emergency?:{id:string;revision:number}|null;
};
export function venueCivilDay(now:Date,timeZone:string):string{
 const parts=new Intl.DateTimeFormat("en-US",{
  timeZone,year:"numeric",month:"2-digit",day:"2-digit"
 }).formatToParts(now);
 const part=(name:string)=>parts.find(p=>p.type===name)?.value||"";
 return [part("year"),part("month"),part("day")].join("-");
}
export function matchesKioskSnapshot(home:PublishedHome,snapshot:KioskSnapshot):boolean{
 const prayer=home.prayer??null,emergency=home.emergency??null;
 return (home.venue?.id??null)===snapshot.venueId
  && (!prayer||prayer.localDate===snapshot.localDay)
  && (prayer?.revision??null)===snapshot.prayerRevision
  && (prayer?.updatedAt??null)===snapshot.prayerUpdatedAt
  && (emergency?.id??null)===snapshot.emergencyId
  && (emergency?.revision??null)===snapshot.emergencyRevision;
}
