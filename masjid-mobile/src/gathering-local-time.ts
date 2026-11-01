/**
 * Event instants are stored as UTC; display them using the explicitly verified
 * event venue's IANA timezone. A legacy unassigned event may use the mosque's
 * configured organization timezone, but the UI MUST label that fallback.
 * Never substitute the device timezone or infer an event venue from its text.
 */
export type GatheringTimeSource = "venue" | "organization";
export type GatheringLocalTime = {
  text: string;
  timeZone: string;
  source: GatheringTimeSource;
};

const canonicalUtc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function gatheringLocalTime(
  startAt: string | null | undefined,
  verifiedVenueZone: string | null | undefined,
  organizationZone: string | null | undefined,
  language: "en" | "ar",
): GatheringLocalTime | null {
  if (!startAt || !canonicalUtc.test(startAt)) return null;
  const instant = new Date(startAt);
  if (!Number.isFinite(instant.getTime()) || instant.toISOString() !== startAt) return null;
  const source: GatheringTimeSource = verifiedVenueZone ? "venue" : "organization";
  const timeZone = verifiedVenueZone || organizationZone;
  if (!timeZone || !timeZone.trim()) return null;
  try {
    const text = new Intl.DateTimeFormat(
      language === "ar" ? "ar-EG-u-ca-gregory" : "en-US",
      {timeZone, dateStyle: "medium", timeStyle: "short"}
    ).format(instant);
    return {text, timeZone, source};
  } catch {
    // Do not silently display device-local time for a misconfigured venue.
    return null;
  }
}
