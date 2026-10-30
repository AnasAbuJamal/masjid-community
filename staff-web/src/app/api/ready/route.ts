import {db} from "@/lib/db";
import {ok,fail} from "@/lib/http";

// Public but detail-free DB readiness. Health probes must be independent:
// /api/health answers "is the app process up?" while /api/ready answers
// "can this process currently serve DB-backed traffic?".
export async function GET(){
 try{
  await db.$queryRaw`SELECT 1`;
  return ok({status:"ready"});
 }catch{
  return fail(503,"NOT_READY","Service temporarily unavailable.");
 }
}
