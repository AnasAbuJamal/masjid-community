import type {Prisma,DeliveryPurpose} from "@prisma/client";
type Db=Prisma.TransactionClient;

// Every notification is owned by a specific mosque. A missing or revoked
// recipient membership must not produce private inbox entries or outbound
// email. Sender workflows should still complete when notifications are skipped.
export async function notifyUser(tx:Db,organizationId:string,userId:string,title:string,body:string,purpose:DeliveryPurpose="service"){
 const membership=await tx.organizationMembership.findUnique({where:{
  organizationId_userId:{organizationId,userId}
 },select:{status:true,user:{select:{status:true,verifiedAt:true}}}});
 if(!membership||membership.status!=="active"||
  membership.user.status!=="active"||!membership.user.verifiedAt)return null;
 // Operational service confirmations are not marketing, but optional
 // campaigns cannot create even an in-app message without explicit, currently
 // active consent from this particular mosque.
 if(purpose!=="service"){
  const consent=await tx.organizationDeliveryPreference.findUnique({where:{
   organizationId_userId_purpose_channel:{
    organizationId,userId,purpose,channel:"email"
   }
  },select:{enabled:true,consentedAt:true}});
  if(!consent?.enabled||!consent.consentedAt)return null;
 }
 const notice=await tx.notification.create({data:{organizationId,userId,title,body,purpose}});
 await tx.outboxEvent.create({data:{userId,notificationId:notice.id,channel:"email"}});
 return notice;
}
