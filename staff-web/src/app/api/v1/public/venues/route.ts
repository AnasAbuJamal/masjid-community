import { db } from "@/lib/db";
import { handled, ok } from "@/lib/http";

// Guest-visible organization and venue metadata only. Never include staff,
// person, membership or other non-public records in this response.
export async function GET() {
  return handled(async () => {
    const organization = await db.organization.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    });
    if (!organization) return ok({ organization: null, venues: [] });
    const venues = await db.venue.findMany({
      where: { organizationId: organization.id },
      orderBy: { id: "asc" },
      take: 50,
      select: { id: true, name: true, address: true, timeZone: true },
    });
    return ok({ organization, venues });
  });
}
