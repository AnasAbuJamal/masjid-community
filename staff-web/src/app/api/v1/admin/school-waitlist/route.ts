import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {schoolStudentScope} from "@/lib/school-scope";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";

const reason=z.string().trim().min(10).max(300);
const command=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("queue"),classId:z.string().min(8),studentId:z.string().min(8),reason}),
 z.object({kind:z.literal("withdraw"),enrollmentId:z.string().min(8),reason}),
 z.object({kind:z.literal("cancel"),waitlistId:z.string().min(8),reason}),
 z.object({kind:z.literal("promote"),waitlistId:z.string().min(8),reason})
]);
type Db=Prisma.TransactionClient;

// Guardian relationship must be approved, unrevoked and linked to an active,
// verified adult in this mosque at both queuing and final promotion.
async function guardianApproved(tx:Db,studentId:string,organizationId:string){
 return !!await tx.guardianLink.findFirst({where:{
  studentId,approvedAt:{not:null},revokedAt:null,
  guardian:{status:"active",verifiedAt:{not:null},role:{not:"student"},
   memberships:{some:{organizationId,status:"active"}}}
 },select:{id:true}});
}

export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin"]);
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const classes=await db.classSection.findMany({where:{program:{organizationId:org.id}},
   orderBy:{id:"asc"},take:100,
   select:{id:true,name:true,capacity:true,program:{select:{title:true}},
    enrollments:{where:{status:"active",student:schoolStudentScope(org.id)},
     select:{id:true,student:{select:{id:true,firstName:true,lastName:true}}}},
    waitlist:{where:{status:"waiting",student:schoolStudentScope(org.id)},
     orderBy:[{requestedAt:"asc"},{id:"asc"}],take:100,
     select:{id:true,studentId:true,requestedAt:true,student:{select:{firstName:true,lastName:true}}}}}
   }});
  return ok({classes,listingLimit:100,
   policy:"Private school data. Only a qualified administrator may queue, withdraw or explicitly promote. Historical enrollments are retained."});
 });
}

export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const admin=await requireVerified(req,["admin"]);
  const input=command.parse(await jsonBody(req));
  const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  try{
   const result=await db.$transaction(async tx=>{
    const now=new Date();
    if(input.kind==="queue"){
     const [klass,student]=await Promise.all([
      tx.classSection.findFirst({where:{id:input.classId,program:{organizationId:org.id}},
       select:{id:true,capacity:true}}),
      tx.student.findFirst({where:{id:input.studentId,...schoolStudentScope(org.id)},select:{id:true}})
     ]);
     if(!klass||!student)throw new HttpError(404,"NOT_FOUND","Student or class unavailable in this mosque.");
     if(!await guardianApproved(tx,student.id,org.id))
      throw new HttpError(409,"GUARDIAN_REVIEW_REQUIRED",
       "A currently verified, approved guardian link is needed before a child can be waitlisted.");
     const existingEnrollment=await tx.enrollment.findUnique({where:{
      studentId_classId:{studentId:student.id,classId:klass.id}
     }});
     if(existingEnrollment)throw new HttpError(409,"ENROLLMENT_EXISTS",
      "A current or historical enrollment requires staff review.");
     const existing=await tx.schoolWaitlist.findUnique({where:{
      classId_studentId:{classId:klass.id,studentId:student.id}
     }});
     if(existing){
      if(existing.status!=="waiting")throw new HttpError(409,"WAITLIST_HISTORY",
       "Previously decided waitlist entries cannot be silently recreated.");
      return {id:existing.id,status:existing.status,created:false};
     }
     if(klass.capacity===null)throw new HttpError(422,"UNLIMITED_CLASS","This class has no seat limit.");
     const occupied=await tx.enrollment.count({where:{classId:klass.id,status:"active"}});
     if(occupied<klass.capacity)throw new HttpError(409,"SEAT_AVAILABLE",
      "Seats are available. Use direct enrollment after the required staff review.");
     const item=await tx.schoolWaitlist.create({data:{classId:klass.id,studentId:student.id}});
     await tx.auditEvent.create({data:{
      actorId:admin.id,action:"school.waitlist.queue",entity:"SchoolWaitlist",entityId:item.id,
      detail:JSON.stringify({organizationId:org.id,classId:klass.id,studentId:student.id,reason:input.reason})
     }});
     return {id:item.id,status:item.status,created:true};
    }
    if(input.kind==="withdraw"){
     const enrollment=await tx.enrollment.findFirst({where:{
      id:input.enrollmentId,status:"active",classSection:{program:{organizationId:org.id}},
      student:schoolStudentScope(org.id)
     },select:{id:true,studentId:true,classId:true}});
     if(!enrollment)throw new HttpError(409,"ENROLLMENT_UNAVAILABLE",
      "Only an active enrollment in this mosque can be withdrawn.");
     const changed=await tx.enrollment.updateMany({where:{
      id:enrollment.id,status:"active",classSection:{program:{organizationId:org.id}}
     },data:{status:"withdrawn"}});
     if(!changed.count)throw new HttpError(409,"ENROLLMENT_CHANGED","Enrollment changed. Refresh.");
     await tx.auditEvent.create({data:{
      actorId:admin.id,action:"school.enrollment.withdraw",entity:"Enrollment",entityId:enrollment.id,
      detail:JSON.stringify({organizationId:org.id,classId:enrollment.classId,
       studentId:enrollment.studentId,reason:input.reason})
     }});
     return {id:enrollment.id,status:"withdrawn",message:"Student withdrawn. The available seat is not automatically assigned."};
    }
    const item=await tx.schoolWaitlist.findFirst({where:{
     id:input.waitlistId,status:"waiting",classSection:{program:{organizationId:org.id}},
     student:schoolStudentScope(org.id)
    },select:{id:true,classId:true,studentId:true}});
    if(!item)throw new HttpError(404,"WAITLIST_UNAVAILABLE","Waiting child unavailable for this mosque.");
    if(input.kind==="cancel"){
     const changed=await tx.schoolWaitlist.updateMany({where:{id:item.id,status:"waiting"},
      data:{status:"cancelled",decidedAt:now,decidedById:admin.id,decisionReason:input.reason}});
     if(!changed.count)throw new HttpError(409,"WAITLIST_CHANGED","Waitlist changed. Refresh.");
     await tx.auditEvent.create({data:{
      actorId:admin.id,action:"school.waitlist.cancel",entity:"SchoolWaitlist",entityId:item.id,
      detail:JSON.stringify({organizationId:org.id,classId:item.classId,reason:input.reason})
     }});
     return {id:item.id,status:"cancelled"};
    }
    const next=await tx.schoolWaitlist.findFirst({where:{
     classId:item.classId,status:"waiting"
    },orderBy:[{requestedAt:"asc"},{id:"asc"}],select:{id:true}});
    if(!next||next.id!==item.id)throw new HttpError(409,"WAITLIST_ORDER",
     "Promote the earliest waiting child first; earlier requests need an explicit reviewed cancellation.");
    if(!await guardianApproved(tx,item.studentId,org.id))
     throw new HttpError(409,"GUARDIAN_REVIEW_REQUIRED",
      "An active, approved guardian relationship is required at promotion time.");
    const klass=await tx.classSection.findFirst({where:{
     id:item.classId,program:{organizationId:org.id}
    },select:{id:true,capacity:true}});
    if(!klass)throw new HttpError(404,"NOT_FOUND","Class unavailable.");
    if(klass.capacity!==null){
     const occupied=await tx.enrollment.count({where:{classId:klass.id,status:"active"}});
     if(occupied>=klass.capacity)throw new HttpError(409,"CLASS_FULL","No available seat. Withdrawals and waitlist promotion are separate reviewed actions.");
    }
    if(await tx.enrollment.findUnique({where:{
     studentId_classId:{classId:item.classId,studentId:item.studentId}
    }}))throw new HttpError(409,"ENROLLMENT_EXISTS","Previous enrollment must be reviewed separately.");
    const changed=await tx.schoolWaitlist.updateMany({where:{id:item.id,status:"waiting"},
     data:{status:"promoted",decidedAt:now,decidedById:admin.id,decisionReason:input.reason}});
    if(!changed.count)throw new HttpError(409,"WAITLIST_CHANGED","Waitlist changed. Refresh.");
    const admitted=await tx.enrollment.create({data:{classId:item.classId,studentId:item.studentId}});
    await tx.auditEvent.create({data:{actorId:admin.id,action:"school.waitlist.promote",
     entity:"SchoolWaitlist",entityId:item.id,detail:JSON.stringify({
      organizationId:org.id,classId:item.classId,studentId:item.studentId,
      enrollmentId:admitted.id,reason:input.reason})}});
    return {id:item.id,status:"promoted",enrollmentId:admitted.id};
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   return ok(result,result.created?201:200);
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&["P2002","P2034"].includes(error.code))
    throw new HttpError(409,"WAITLIST_CHANGED","The school waitlist or last available seat changed. Refresh and retry.");
   throw error;
  }
 });
}
