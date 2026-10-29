import {randomUUID} from "node:crypto";
import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {notifyUser} from "@/lib/notifications";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
export async function GET(req:NextRequest){
 return handled(async()=>{
  await requireVerified(req,["admin"]);
  const organization=await db.organization.findFirst();
  const applications=organization?await db.enrollmentApplication.findMany({where:{organizationId:organization.id},take:100,
   orderBy:{createdAt:"desc"},select:{id:true,studentFirstName:true,studentLastName:true,notes:true,status:true,decisionReason:true,
     program:{select:{title:true}},applicant:{select:{firstName:true,lastName:true,email:true,verifiedAt:true}},
     reviewAcknowledgedAt:true,reviewAcknowledgementVersion:true,createdAt:true}}):[];
  return ok({applications});
 });
}
export async function PATCH(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const admin=await requireVerified(req,["admin"]);
  const input=z.object({id:z.string().min(8),decision:z.enum(["approved","declined"]),
   reason:z.string().trim().min(5).max(500),relationshipVerified:z.boolean()}).parse(await jsonBody(req));
  if(input.decision==="approved"&&!input.relationshipVerified)
   throw new HttpError(422,"VERIFICATION_REQUIRED","Confirm the applicant's legal guardian relationship before approval.");
  const organization=await db.organization.findFirst();
  if(!organization)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const result=await db.$transaction(async tx=>{
   const app=await tx.enrollmentApplication.findFirst({where:{id:input.id,organizationId:organization.id},include:{applicant:true}});
   if(!app||app.status!=="submitted")throw new HttpError(409,"NOT_PENDING","Application already decided or unavailable.");
   if(!app.applicant.verifiedAt||app.applicant.status!=="active"||app.applicant.role==="student")
    throw new HttpError(403,"APPLICANT_INVALID","Guardian account is not a verified active adult account.");
   if(input.decision==="approved"&&!app.reviewAcknowledgedAt)
    throw new HttpError(409,"ACKNOWLEDGEMENT_REQUIRED",
     "The applicant must acknowledge the review conditions before a child profile can be linked.");
   const now=new Date();
   const claim=await tx.enrollmentApplication.updateMany({where:{id:app.id,status:"submitted"},data:{status:input.decision,reviewedById:admin.id,reviewedAt:now,decisionReason:input.reason}});
   if(!claim.count)throw new HttpError(409,"STALE_APPLICATION","Application already reviewed.");
   if(input.decision==="declined"){
    await tx.auditEvent.create({data:{actorId:admin.id,action:"enrollment.declined",entity:"EnrollmentApplication",entityId:app.id}});
    await notifyUser(tx,app.applicantUserId,"School application reviewed","Your program application was declined. Contact the school for details.");
    return {id:app.id,status:"declined"};
   }
   const student=await tx.student.create({data:{organizationId:organization.id,studentNumber:"STU-"+randomUUID(),firstName:app.studentFirstName,lastName:app.studentLastName}});
   await tx.guardianLink.create({data:{guardianId:app.applicantUserId,studentId:student.id,approvedAt:now}});
   await tx.enrollmentApplication.update({where:{id:app.id},data:{approvedStudentId:student.id}});
   await tx.auditEvent.create({data:{actorId:admin.id,action:"enrollment.approved",entity:"EnrollmentApplication",entityId:app.id}});
   await notifyUser(tx,app.applicantUserId,"School application approved","Your child's profile is now linked. Class enrollment will be confirmed separately by the school.");
   return {id:app.id,status:"approved",studentId:student.id};
  },{isolationLevel:"Serializable"});
  return ok(result);
 });
}
