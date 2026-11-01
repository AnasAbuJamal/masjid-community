/**
 * A backgrounded app may resume long after its interval timer paused.
 * Refresh only on an actual inactive/background -> active transition:
 * an initial "active" event should not double-fetch first-run data.
 */
export function shouldRefreshVenueOnResume(
 previous: string | null | undefined,
 current: string,
): boolean {
 return current === "active" &&
   (previous === "inactive" || previous === "background");
}
