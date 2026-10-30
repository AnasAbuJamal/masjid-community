import {createCipheriv,createDecipheriv,randomBytes} from "node:crypto";
import type {NextRequest} from "next/server";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {HttpError} from "@/lib/http";

const policyVersion="care-consent-v1";
function validText(value:string|undefined,min:number,max:number){
 return !!value&&value.trim().length>=min&&value.trim().length<=max;
}
export function carePolicy(){
 const hours=process.env.SILA_CARE_POLICY_HOURS||"";
 const response=process.env.SILA_CARE_POLICY_RESPONSE||"";
 const limits=process.env.SILA_CARE_POLICY_LIMITS||"";
 const emergency=process.env.SILA_CARE_POLICY_EMERGENCY||"";
 const key=process.env.SILA_CARE_ENCRYPTION_KEY||"";
 const available=process.env.SILA_CARE_INTAKE_ENABLED==="true"&&
  /^[a-f0-9]{64}$/i.test(key)&&
  validText(hours,10,240)&&validText(response,15,240)&&
  validText(limits,25,600)&&validText(emergency,25,600);
 return {enabled:available,hours:available?hours:"",response:available?response:"",
  limits:available?limits:"",emergency:available?emergency:"",
  consentVersion:policyVersion,
  message:available?"Confidential intake uses restricted human review, not emergency response.":
   "Confidential online assistance is not enabled by this organization. Contact the mosque through its ordinary published channels; for emergencies use local emergency services."};
}
export function requireCareIntake(){
 const policy=carePolicy();
 if(!policy.enabled)throw new HttpError(503,"CARE_NOT_ENABLED",
  "This organization has not approved confidential online care intake.");
 return policy;
}
function key(){
 const input=process.env.SILA_CARE_ENCRYPTION_KEY||"";
 if(!/^[a-f0-9]{64}$/i.test(input))throw new HttpError(503,"CARE_KEY_UNAVAILABLE",
  "Confidential case access is unavailable. Contact the designated privacy officer.");
 return Buffer.from(input,"hex");
}
// v1 stores random nonce + GCM tag + encrypted body. Organization and case ID
// are authenticated associated data, so moving ciphertext to another case fails.
export function encryptCare(message:string,orgId:string,caseId:string){
 const nonce=randomBytes(12);
 const cipher=createCipheriv("aes-256-gcm",key(),nonce);
 cipher.setAAD(Buffer.from(orgId+":"+caseId,"utf8"));
 const encrypted=Buffer.concat([cipher.update(message,"utf8"),cipher.final()]);
 return "v1:"+nonce.toString("base64url")+":"+cipher.getAuthTag().toString("base64url")+":"+encrypted.toString("base64url");
}
export function decryptCare(encoded:string,orgId:string,caseId:string){
 const [version,iv,tag,body,...extra]=encoded.split(":");
 if(version!=="v1"||!iv||!tag||!body||extra.length)throw new HttpError(503,"CARE_RECORD_ERROR",
  "This case cannot be opened. Contact the privacy officer.");
 try{
  const nonce=Buffer.from(iv,"base64url");
  const authTag=Buffer.from(tag,"base64url");
  if(nonce.length!==12||authTag.length!==16)throw new Error("invalid envelope");
  const decipher=createDecipheriv("aes-256-gcm",key(),nonce);
  decipher.setAAD(Buffer.from(orgId+":"+caseId,"utf8"));
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(Buffer.from(body,"base64url")),decipher.final()]).toString("utf8");
 }catch{
  throw new HttpError(503,"CARE_RECORD_ERROR","This case cannot be opened. Contact the privacy officer.");
 }
}
export async function careCoordinator(req:NextRequest){
 // A general admin account has no implicit right to case data. A verified
 // staff member needs an explicit nonexpired capability AND session MFA.
 const actor=await requireVerified(req,["staff"]);
 if(!actor.mfaVerified)throw new HttpError(403,"CARE_MFA_REQUIRED",
  "Verify your authenticator for this session before handling confidential requests.");
 const org=await db.organization.findFirst({orderBy:{createdAt:"asc"},select:{id:true}});
 if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
 const grant=await db.roleGrant.findFirst({where:{
  membership:{organizationId:org.id,userId:actor.id,status:"active"},
  capability:"care_manage",revokedAt:null,
  OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]
 },select:{id:true}});
 if(!grant)throw new HttpError(403,"CARE_ACCESS_DENIED",
  "This case workspace requires a current confidential-care assignment.");
 return {actor,org};
}
