import {NextRequest} from "next/server";
import {requireMemberContext} from "@/lib/auth";
import {handled,HttpError,ok} from "@/lib/http";
import {gatheringFilters,publishedGatheringPage} from "@/lib/gathering-filters";

// F-007/F-048: authenticated catalog belongs to the active member's selected
// organization in the server-held session, never a client-provided mosque ID.
export async function GET(req:NextRequest){
 return handled(async()=>{
  const {org}=await requireMemberContext(req);
  const parts=gatheringFilters(req.nextUrl.searchParams);
  if(parts.venueId&&!await db.venue.findFirst({
   where:{id:parts.venueId,organizationId:org.id},select:{id:true}
  }))throw new HttpError(404,"VENUE_NOT_FOUND","Venue unavailable.");
  const page=await publishedGatheringPage(org.id,parts);
  if(parts.id&&!page.items.length)throw new HttpError(404,"NOT_FOUND","Gathering unavailable.");
  return ok({organization:{id:org.id,name:org.name,timeZone:org.timeZone},
   ...page,scope:"current_verified_membership",
   note:"Only published gatherings in the active selected mosque. Dates are UTC instants; verified venue timezones are included with every assigned venue. Missing accessibility information means unverified, not accessible."});
 });
}
