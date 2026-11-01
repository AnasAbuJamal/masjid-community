/**
 * Native emergency notice time interlock.
 *
 * Server authorization remains the source of publication truth. This client
 * check only prevents a previously authorized notice from staying visibly
 * authoritative after its expiration or after a malformed timestamp arrives.
 *
 * Do not interpret an expired notice as "venue is safe" or restore it from
 * offline persistence. Emergency instructions need an online recheck.
 */
const ISO_UTC_MILLIS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MAX_RECHECK_MS = 60_000;

export function emergencyExpiry(value: unknown): number | null {
  if (typeof value !== "string" || !ISO_UTC_MILLIS.test(value)) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  // Date.parse may normalize invalid calendar dates. Only accept an exact
  // canonical ISO representation from the server's Date serialization.
  try {
    return new Date(timestamp).toISOString() === value ? timestamp : null;
  } catch {
    return null;
  }
}

export function isCurrentVenueEmergency(
  expiresAt: unknown,
  nowMs: number = Date.now(),
): boolean {
  const expiry = emergencyExpiry(expiresAt);
  return expiry !== null && Number.isFinite(nowMs) && nowMs < expiry;
}

export function emergencyRecheckDelay(
  expiresAt: unknown,
  nowMs: number = Date.now(),
): number | null {
  const expiry = emergencyExpiry(expiresAt);
  if (expiry === null || !Number.isFinite(nowMs) || nowMs >= expiry) return null;
  // Rerender exactly after expiry for the final minute. Longer windows are
  // reviewed periodically and also on app foreground restoration.
  return Math.min(MAX_RECHECK_MS, Math.max(1, Math.ceil(expiry - nowMs + 1)));
}
