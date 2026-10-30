import {ok} from "@/lib/http";

// Public liveness must not require the DB. A database outage means the
// instance can still be alive and able to serve 503s while recovery proceeds.
// Do not expose host, connection, migration, tenant, or provider details.
export async function GET(){
 return ok({status:"alive",check:"liveness"});
}
