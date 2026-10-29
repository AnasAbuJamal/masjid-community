/** Select a future, mosque-published prayer only for the venue's current calendar day. */
export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
export type PublishedPrayerDay = {localDate: string} & Partial<Record<PrayerName, string | null>>;
export type UpcomingPrayer = {name: PrayerName; time: string};

const prayerNames: readonly PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const validClock = /^(?:[01]\\d|2[0-3]):[0-5]\\d$/;

export function nextPublishedPrayer(
  day: PublishedPrayerDay | null | undefined,
  venueTimeZone: string | null | undefined,
  now: Date = new Date(),
): UpcomingPrayer | null {
  if (!day || !venueTimeZone || !Number.isFinite(now.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: venueTimeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(now);
    const get = (kind: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === kind)?.value;
    const year = get("year"), month = get("month"), date = get("day");
    const hour = get("hour"), minute = get("minute");
    if (!year || !month || !date || !hour || !minute) return null;
    if (`${year}-${month}-${date}` !== day.localDate) return null;
    const clock = `${hour}:${minute}`;
    for (const name of prayerNames) {
      const time = day[name];
      if (typeof time === "string" && validClock.test(time) && time > clock)
        return {name, time};
    }
  } catch {
    // Invalid or unsupported timezone: never show an unverified "next" prayer.
  }
  return null;
}
