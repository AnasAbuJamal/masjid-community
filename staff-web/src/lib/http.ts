import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export function ok(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status, headers: { "Cache-Control": "no-store" } });
}
export function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message, retryable: status >= 500 } }, { status, headers: { "Cache-Control": "no-store" } });
}
export async function handled(action: () => Promise<Response>): Promise<Response> {
  try { return await action(); }
  catch (error) {
    if (error instanceof HttpError) return fail(error.status, error.code, error.message);
    if (error instanceof ZodError) return fail(422, "VALIDATION", error.issues.map(x => x.message).join("; "));
    console.error("API failure", error instanceof Error ? error.name : "unknown");
    return fail(500, "SERVER_ERROR", "The request could not be completed.");
  }
}
export function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.nextUrl.host) throw new HttpError(403, "ORIGIN", "Origin not allowed.");
}
export async function jsonBody(req: NextRequest) {
  if (Number(req.headers.get("content-length") || 0) > 65536) throw new HttpError(413, "TOO_LARGE", "Payload too large.");
  try { return await req.json(); } catch { throw new HttpError(400, "INVALID_JSON", "Invalid JSON body."); }
}
export function localDate(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US",{year:"numeric",month:"2-digit",day:"2-digit",timeZone}).formatToParts(date);
  const p=(name:string)=>parts.find(x=>x.type===name)?.value||"";
  return p("year")+"-"+p("month")+"-"+p("day");
}
