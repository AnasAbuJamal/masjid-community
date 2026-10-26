import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity, isStaff } from "@/lib/api-identity";
export async function GET(req: NextRequest) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const bookings = await prisma.rentalBooking.findMany({
    where: isStaff(user.role) ? {} : { renterEmail: user.email },
    include: { item: { select: { name: true, category: true } } },
    orderBy: { createdAt: "desc" }, take: 100,
  });
  return NextResponse.json(bookings.map(b => ({
    ...b, id: String(b.id), itemId: String(b.itemId),
  })), { headers: { "Cache-Control": "no-store" } });
}
