import { db } from "@/lib/db";
import { fail, ok } from "@/lib/http";

// The health endpoint reports database connectivity only. It must never expose
// connection strings, SQL errors, or infrastructure details to public callers.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return ok({ status: "ok", database: "reachable" });
  } catch {
    return fail(503, "NOT_READY", "Database unavailable.");
  }
}
