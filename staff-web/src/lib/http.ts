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
  // Browsers serialize Origin as an exact scheme://host[:port] value.
  // Next.js may canonicalize req.nextUrl.hostname to "localhost" even when
  // the incoming HTTP Host is 127.0.0.1. Match the actual request authority
  // instead; the Host header is set by the browser's destination request.
  // Reject malformed, opaque, path-bearing, wrong-port and wrong-scheme
  // origins with 403. Native Bearer clients may omit Origin, but a browser
  // session authenticated by cookie MUST supply it on every protected write.
  // SameSite=strict alone is not a substitute for checking browser origins.
  const bearer = req.headers.get("authorization")?.startsWith("Bearer ");
  if (origin === null && req.cookies.has("masjid_session") && !bearer)
    throw new HttpError(403, "ORIGIN", "Origin required for browser session writes.");
  const authority = req.headers.get("host");
  if (origin !== null && (!authority || origin !== req.nextUrl.protocol + "//" + authority))
    throw new HttpError(403, "ORIGIN", "Origin not allowed.");
}
export async function jsonBody(req: NextRequest) {
  const limit = 65536;
  const declared = req.headers.get("content-length");
  // Content-Length is not a trusted upper bound: chunked transfer encoding
  // has no length header and a proxy can relay bytes differently.
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > limit))
    throw new HttpError(413, "TOO_LARGE", "Payload too large.");
  if (!req.body) throw new HttpError(400, "INVALID_JSON", "Invalid JSON body.");
  const reader = req.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        // Stop reading immediately, even for a single oversized stream chunk.
        await reader.cancel().catch(() => {});
        throw new HttpError(413, "TOO_LARGE", "Payload too large.");
      }
      chunks.push(Buffer.from(value));
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "INVALID_JSON", "Invalid JSON body.");
  } finally {
    reader.releaseLock();
  }
  try {
    // Fatal decoding rejects malformed UTF-8 before JSON parsing; the byte
    // count (not JavaScript string length) is what the 64-KiB cap protects.
    return JSON.parse(new TextDecoder("utf-8", { fatal: true })
      .decode(Buffer.concat(chunks, total)));
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Invalid JSON body.");
  }
}
export function localDate(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US",{year:"numeric",month:"2-digit",day:"2-digit",timeZone}).formatToParts(date);
  const p=(name:string)=>parts.find(x=>x.type===name)?.value||"";
  return p("year")+"-"+p("month")+"-"+p("day");
}
