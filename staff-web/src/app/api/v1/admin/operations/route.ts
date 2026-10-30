import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {notifyUser} from "@/lib/notifications";
import {requireCapability} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
const schema=z.object({kind:z.literal("rental-decision"),bookingId:z.string().min(8),decision:z.enum(["approved","rejected"])});
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireCapability(req,"facilities_manage");
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const bookings=await db.rentalBooking.findMany({where:{status:"requested",resource:{organizationId:org.id}},take:100,orderBy:{startAt:"asc"},
   select:{id:true,startAt:true,endAt:true,status:true,
    resource:{select:{id:true,title:true}},
    user:{select:{id:true,firstName:true,lastName:true,email:true}}}});
  return ok({bookings});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireCapability(req,"facilities_manage");
  const value=schema.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const result=await db.$transaction(async tx=>{
   const booking=await tx.rentalBooking.findFirst({where:{id:value.bookingId,resource:{organizationId:org.id}}});
   if(!booking||booking.status!=="requested")throw new HttpError(409,"NOT_PENDING","Booking request is no longer pending.");
   if(value.decision==="approved"){
    if(booking.startAt<=new Date())throw new HttpError(409,"IN_PAST","This booking request has expired.");
    const conflict=await tx.rentalBooking.findFirst({where:{resourceId:booking.resourceId,status:"approved",id:{not:booking.id},startAt:{lt:booking.endAt},endAt:{gt:booking.startAt}}});
    if(conflict)throw new HttpError(409,"BOOKING_CONFLICT","This slot overlaps an approved booking.");
   }
   const updated=await tx.rentalBooking.updateMany({where:{id:booking.id,status:"requested",resource:{organizationId:org.id}},data:{status:value.decision}});
   if(!updated.count)throw new HttpError(409,"STALE_BOOKING","Booking already updated.");
   await tx.auditEvent.create({data:{actorId:user.id,action:"booking."+value.decision,entity:"RentalBooking",entityId:booking.id}});
   await notifyUser(tx,org.id,booking.userId,"Your facility request was reviewed","Your booking request is "+value.decision+". View your account for details.");
   return {bookingId:booking.id,status:value.decision};
  },{isolationLevel:"Serializable"});
  return ok(result);
 });
}
