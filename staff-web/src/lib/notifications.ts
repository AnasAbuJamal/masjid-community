import type {Prisma} from "@prisma/client";
type Db=Prisma.TransactionClient;
export async function notifyUser(tx:Db,userId:string,title:string,body:string){
 const notice=await tx.notification.create({data:{userId,title,body}});
 await tx.outboxEvent.create({data:{userId,notificationId:notice.id,channel:"email"}});
 return notice;
}
