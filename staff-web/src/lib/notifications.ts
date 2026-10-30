import type {Prisma} from "@prisma/client";
type Db=Prisma.TransactionClient;

// Every notification is owned by a specific mosque. A missing or revoked
// recipient membership must not produce private inbox entries or outbound
// email. Sender workflows should still complete when notifications are skipped.
export async function notifyUser(tx:Db,organizationId:string,userId:string,title:string,body:string){
 const membership=await tx.organizationMembership.findUnique({where:{
  organizationId_userId:{organizationId,userId}
 },select:{status:true,user:{select:{status:true,verifiedAt:true}}}});
 if(!membership||membership.status!=="active"||
  membership.user.status!=="active"||!membership.user.verifiedAt)return null;
 const notice=await tx.notification.create({data:{organizationId,userId,title,body}});
 await tx.outboxEvent.create({data:{userId,notificationId:notice.id,channel:"email"}});
 return notice;
}
