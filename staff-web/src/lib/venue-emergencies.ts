import {db} from "@/lib/db";

// Server-controlled published state and a future expiration are BOTH required.
// No personal, roster or staff identity data can enter these public responses.
export const VENUE_EMERGENCY_FIELDS={
 id:true,venueId:true,kind:true,title:true,body:true,instructions:true,
 publishedAt:true,expiresAt:true,revision:true
} as const;
export async function currentVenueEmergency(venueId:string|null|undefined,now=new Date()){
 if(!venueId)return null;
 return db.venueEmergencyNotice.findFirst({
  where:{venueId,status:"published",publishedAt:{lte:now},expiresAt:{gt:now}},
  select:VENUE_EMERGENCY_FIELDS
 });
}
