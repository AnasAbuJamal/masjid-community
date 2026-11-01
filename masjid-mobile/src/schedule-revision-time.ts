/** Format verified prayer publication metadata in the actual venue timezone.
 * Never silently substitute the device timezone for a mosque's publication.
 * Arabic dates use the Gregorian calendar explicitly to avoid an unreviewed
 * date-calendar switch in the safety-critical published schedule.
 */
export function scheduleRevisionTime(
 value: string | null | undefined,
 timeZone: string | null | undefined,
 language: "en" | "ar",
): string | null {
 if (!value || !timeZone) return null;
 const date = new Date(value);
 if (!Number.isFinite(date.getTime())) return null;
 try {
  return new Intl.DateTimeFormat(
   language === "ar" ? "ar-EG-u-ca-gregory" : "en-US",
   {timeZone,dateStyle:"medium",timeStyle:"short"}
  ).format(date);
 } catch {
  return null;
 }
}
