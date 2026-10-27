import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { logAudit, getClientIp } from "@/lib/audit";

class BookingConflict extends Error {}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getApiIdentity(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) < 1)
    return NextResponse.json({ error: "Invalid booking" }, { status: 400 });
  const data = await req.json().catch(() => null);
  if (!data || Object.keys(data).length !== 1 ||
      !["approved", "rejected"].includes(data.status))
    return NextResponse.json({ error: "Select approved or rejected" }, { status: 400 });
  const desired: "approved" | "rejected" = data.status;
  try {
    const booking = await prisma.$transaction(async tx => {
      const current = await tx.rentalBooking.findUnique({
        where: { id: Number(raw) },
        include: { item: { select: { isAvailable: true } } },
      });
      if (!current) return null;
      if (current.status === desired) return current;
      if (!["pending", "approved"].includes(current.status))
        throw new BookingConflict("Only pending and approved bookings can be reviewed");
      if (desired === "approved") {
        if (!current.item.isAvailable)
          throw new BookingConflict("This facility is not currently available");
        const overlaps = await tx.rentalBooking.count({
          where: {
            itemId: current.itemId, id: { not: current.id }, status: "approved",
            startDate: { lt: current.endDate },
            endDate: { gt: current.startDate },
          },
        });
        if (overlaps) throw new BookingConflict("The requested time overlaps another approved booking");
      }
      const claimed = await tx.rentalBooking.updateMany({
        where: { id: current.id, status: current.status }, data: { status: desired },
      });
      if (claimed.count !== 1) throw new BookingConflict("Booking changed, refresh and retry");
      return { ...current, status: desired };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    await logAudit({ action: "mobile_facility_booking_review", userId: String(admin.id),
      details: `Booking ${raw} changed to ${desired}`, ipAddress: getClientIp(req) });
    return NextResponse.json({ id: raw, status: booking.status }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BookingConflict)
      return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034")
      return NextResponse.json({ error: "Booking updated elsewhere. Refresh and retry" }, { status: 409 });
    console.error("Facility review failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Unable to review booking" }, { status: 500 });
  }
}
