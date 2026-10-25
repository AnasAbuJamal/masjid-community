import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const bookings = await prisma.rentalBooking.findMany({
    where: { renterEmail: { equals: session.user.email, mode: "insensitive" } },
    include: { item: { select: { name: true, category: true } } }, orderBy: { createdAt: "desc" }, take: 100,
  });
  return NextResponse.json(bookings.map(b => ({ ...b, id: String(b.id), itemId: String(b.itemId) })), { headers: { "Cache-Control": "no-store" } });
}
