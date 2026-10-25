/** Only known member destinations may be opened from server-provided links. */
export function notificationDestination(link: string | null | undefined): string | null {
  if (!link) return null;
  if (/^\/(jobs|proposals|announcements|events|rentals|blog)\/\d+$/.test(link)) return link;
  if (['/jobs', '/proposals', '/events', '/rentals', '/blog', '/applications', '/donations/history'].includes(link)) return link;
  return null;
}
