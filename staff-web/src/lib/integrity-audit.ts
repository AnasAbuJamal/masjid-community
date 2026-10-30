import {createHmac,randomUUID,timingSafeEqual} from "node:crypto";
import type {NextRequest} from "next/server";
import type {Prisma} from "@prisma/client";
import {db} from "./db";
import {HttpError} from "./http";

// New critical-operation audit only. Old AuditEvent records are neither
// sealed nor automatically assigned to an organization.
type Db=Prisma.TransactionClient;
export type AuditEvidence=Partial<Record<
 "capability"|"from"|"to"|"expiresAt"|"scope"|"sessionRevoked",
 string|boolean|null
>>;
type Entry={
 id:string;organizationId:string;actorId:string;sequence:number;
 occurredAt:Date;requestId:string;action:string;entity:string;entityId:string;
 outcome:string;evidence:unknown;previousHash:string;recordHash:string
};
const ZERO="0".repeat(64);
function key(){
 const hex=process.env.SILA_AUDIT_HMAC_KEY||"";
 const duplicates=[
  process.env.MFA_ENCRYPTION_KEY,process.env.SILA_CARE_ENCRYPTION_KEY,
  process.env.AUTH_SECRET,process.env.CRON_SECRET,process.env.SILA_OPERATIONS_SECRET
 ].filter((s):s is string=>!!s).some(s=>s.toLowerCase()===hex.toLowerCase());
 if(!/^[0-9a-fA-F]{64}$/.test(hex)||duplicates)
  throw new HttpError(503,"AUDIT_INTEGRITY_NOT_CONFIGURED",
   "Sealed high-risk audit operations require a separately managed integrity key.");
 return Buffer.from(hex,"hex");
}
export function auditRequestId(req:NextRequest){
 const caller=req.headers.get("x-request-id");
 return caller&&/^[a-zA-Z0-9_-]{8,64}$/.test(caller)?caller:randomUUID();
}
function canonical(value:unknown):string{
 if(value===null||typeof value!=="object")return JSON.stringify(value)??"null";
 if(Array.isArray(value))return "["+value.map(canonical).join(",")+"]";
 const record=value as Record<string,unknown>;
 return "{"+Object.keys(record).sort().map(k=>
  JSON.stringify(k)+":"+canonical(record[k])).join(",")+"}";
}
function payload(v:Omit<Entry,"recordHash">){
 return canonical({
  version:1,id:v.id,organizationId:v.organizationId,
  actorId:v.actorId,sequence:v.sequence,
  occurredAt:v.occurredAt.toISOString(),requestId:v.requestId,
  action:v.action,entity:v.entity,entityId:v.entityId,
  outcome:v.outcome,evidence:v.evidence,previousHash:v.previousHash
 });
}
function digest(value:Omit<Entry,"recordHash">){
 return createHmac("sha256",key()).update(payload(value),"utf8").digest("hex");
}
function isSame(a:string,b:string){
 if(!/^[a-f0-9]{64}$/.test(a)||! /^[a-f0-9]{64}$/.test(b))return false;
 return timingSafeEqual(Buffer.from(a,"hex"),Buffer.from(b,"hex"));
}
function safeEvidence(input:AuditEvidence){
 const keys=["capability","from","to","expiresAt","scope","sessionRevoked"];
 for(const [key,value] of Object.entries(input)){
  if(!keys.includes(key)||typeof value==="object"&&value!==null||
   typeof value==="number"||
   typeof value==="string"&&(value.length>120||/[\r\n\x00-\x1f]/.test(value)))
   throw new HttpError(422,"AUDIT_EVIDENCE_INVALID",
    "Only non-sensitive, bounded state-transition metadata may be sealed.");
 }
 return input;
}
type Command={
 request:NextRequest;organizationId:string;actorId:string;
 action:string;entity:string;entityId:string;
 outcome?:"allowed"|"denied";evidence?:AuditEvidence
};
// Call inside the SAME business transaction. A per-organization advisory
// transaction lock serializes sequence assignment without a global lock.
// The audit inserts roll back with business failure; no phantom success.
export async function appendIntegrityAudit(tx:Db,command:Command){
 key();
 if(!command.organizationId||!command.actorId||
  !/^[a-z0-9_.-]{4,96}$/.test(command.action)||
  !/^[a-zA-Z][a-zA-Z0-9]{2,80}$/.test(command.entity)||
  !command.entityId)
  throw new HttpError(422,"AUDIT_SCOPE_INVALID","Audit event scope is invalid.");
 const belongs=await tx.organizationMembership.findUnique({where:{
  organizationId_userId:{
   organizationId:command.organizationId,userId:command.actorId
  }
 },select:{status:true}});
 if(!belongs||belongs.status!=="active")
  throw new HttpError(403,"AUDIT_ACTOR_SCOPE","A sealed action must have an active mosque actor.");
 await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(${command.organizationId}::text, 785::bigint))`;
 const previous=await tx.integrityAuditEvent.findFirst({
  where:{organizationId:command.organizationId},orderBy:{sequence:"desc"},
  select:{sequence:true,recordHash:true}
 });
 const item:Omit<Entry,"recordHash">={
  id:randomUUID(),organizationId:command.organizationId,actorId:command.actorId,
  sequence:(previous?.sequence||0)+1,occurredAt:new Date(),
  requestId:auditRequestId(command.request),action:command.action,
  entity:command.entity,entityId:command.entityId,
  outcome:command.outcome||"allowed",evidence:safeEvidence(command.evidence||{}),
  previousHash:previous?.recordHash||ZERO
 };
 const recordHash=digest(item);
 return tx.integrityAuditEvent.create({data:{
  ...item,recordHash,
  // Validation above restricts evidence to a bounded, allowlisted JSON object.
  evidence:safeEvidence(command.evidence||{}) as Prisma.InputJsonValue
 },
  select:{id:true,sequence:true,recordHash:true}});
}
export type AuditVerification={
 state:"verified"|"invalid"|"incomplete";
 checked:number;failureCode:string|null;lastHash:string|null;
 hasMore:boolean;scope:"single_organization";
};
// Integrity verification computes HMAC of every row checked and verifies
// continuous sequence and links. Pagination limit is intentionally explicit:
// do not call an unchecked suffix verified. An independent offsite anchored
// chain head is still required for DBA-level tamper resistance.
export async function verifyIntegrityAudit(organizationId:string):Promise<AuditVerification>{
 key();
 let sequence=0,hash=ZERO;
 const max=10000,page=250;
 for(;;){
  const rows=await db.integrityAuditEvent.findMany({where:{
   organizationId,sequence:{gt:sequence}
  },orderBy:{sequence:"asc"},take:page,
   select:{id:true,organizationId:true,actorId:true,sequence:true,
    occurredAt:true,requestId:true,action:true,entity:true,entityId:true,
    outcome:true,evidence:true,previousHash:true,recordHash:true}});
  if(!rows.length)return {state:"verified",checked:sequence,
   failureCode:null,lastHash:sequence?hash:null,hasMore:false,scope:"single_organization"};
  for(const row of rows){
   if(row.sequence!==sequence+1)return {state:"invalid",checked:sequence,
    failureCode:"SEQUENCE_GAP",lastHash:hash,hasMore:true,scope:"single_organization"};
   if(!isSame(row.previousHash,hash))return {state:"invalid",checked:sequence,
    failureCode:"CHAIN_LINK_INVALID",lastHash:hash,hasMore:true,scope:"single_organization"};
   const calculated=digest({
    id:row.id,organizationId:row.organizationId,actorId:row.actorId,
    sequence:row.sequence,occurredAt:row.occurredAt,requestId:row.requestId,
    action:row.action,entity:row.entity,entityId:row.entityId,
    outcome:row.outcome,evidence:row.evidence,previousHash:row.previousHash
   });
   if(!isSame(row.recordHash,calculated))return {state:"invalid",checked:sequence,
    failureCode:"HMAC_INVALID",lastHash:hash,hasMore:true,scope:"single_organization"};
   sequence=row.sequence;hash=row.recordHash;
   if(sequence>=max){
    const remainder=await (await import("./db")).db.integrityAuditEvent.count({
     where:{organizationId,sequence:{gt:sequence}}
    });
    return {state:remainder?"incomplete":"verified",checked:sequence,
     failureCode:remainder?"REVIEW_WINDOW_LIMIT":null,lastHash:hash,
     hasMore:remainder>0,scope:"single_organization"};
   }
  }
  if(rows.length<page)return {state:"verified",checked:sequence,
   failureCode:null,lastHash:hash,hasMore:false,scope:"single_organization"};
 }
}
