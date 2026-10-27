import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";

export async function GET(req: NextRequest) {
  const admin = await getApiIdentity(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [items, bookings] = await Promise.all([
    prisma.rentalItem.findMany({
      orderBy: { name: "asc" }, take: 200,
      select: { id: true, name: true, description: true, category: true,
        isAvailable: true, priceHourly: true, priceDaily: true },
    }),
    prisma.rentalBooking.findMany({
      include: { item: { select: { name: true, category: true } } },
      orderBy: { createdAt: "desc" }, take: 150,
    }),
  ]);
  return NextResponse.json({
    facilities: items.map(item => ({ ...item, id: String(item.id) })),
    bookings: bookings.map(booking => ({
      id: String(booking.id), itemId: String(booking.itemId),
      itemName: booking.item.name, category: booking.item.category,
      renterName: booking.renterName, renterEmail: booking.renterEmail,
      eventName: booking.eventName, startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(), totalPrice: booking.totalPrice,
      status: booking.status, createdAt: booking.createdAt.toISOString(),
    })),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
