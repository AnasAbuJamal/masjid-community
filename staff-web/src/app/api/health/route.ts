import { db } from "@/lib/db";
import { fail, ok } from "@/lib/http";
export async function GET() {
 try { await db.$queryRawUnsafe("SELECT 1"); return ok({status:"ok",database:"reachable"}); }
 catch { return fail(503,"NOT_READY","Database unavailable."); }
}
