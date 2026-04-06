import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;

function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanupOldEntries, RATE_LIMIT_WINDOW_MS);

export function rateLimit(
  identifier: string,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `rate_limit_${identifier}`;

  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);

  return {
    success: entry.count <= maxRequests,
    remaining,
    resetTime: entry.resetTime,
  };
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

export function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === "true";
}

export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetTime: number
): NextResponse {
  const secondsUntilReset = Math.ceil((resetTime - Date.now()) / 1000);
  
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", resetTime.toString());
  response.headers.set("X-RateLimit-Window", Math.ceil(RATE_LIMIT_WINDOW_MS / 1000).toString());
  
  if (secondsUntilReset > 0) {
    response.headers.set("Retry-After", secondsUntilReset.toString());
  }
  
  return response;
}

export function checkMaintenanceMode(): NextResponse | null {
  if (isMaintenanceMode()) {
    return NextResponse.json(
      {
        error: "Service Unavailable",
        message: "The application is currently under maintenance. Please try again later.",
        maintenance: true,
      },
      {
        status: 503,
        headers: {
          "Retry-After": "3600",
          "Cache-Control": "no-store",
        },
      }
    );
  }
  return null;
}
