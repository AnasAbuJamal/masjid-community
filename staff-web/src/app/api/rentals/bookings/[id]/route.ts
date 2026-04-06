import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { action, adminNotes } = body;

        const newStatus = action === "approve" ? "approved" : 
                         action === "reject" ? "rejected" : 
                         action === "complete" ? "completed" : 
                         action === "cancel" ? "cancelled" : undefined;

        if (!newStatus) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const booking = await prisma.rentalBooking.update({
            where: { id },
            data: {
                status: newStatus,
                adminNotes: adminNotes || null,
            },
            include: { item: { select: { name: true } } },
        });

        await logAudit({
            action: action === "approve" ? "approve_rental_booking" : 
                    action === "reject" ? "reject_rental_booking" : 
                    action === "complete" ? "complete_rental_booking" : "cancel_rental_booking",
            userId: session.user.id,
            details: `${action === "approve" ? "Approved" : action === "reject" ? "Rejected" : action === "complete" ? "Completed" : "Cancelled"} rental booking for ${booking.item.name}`,
            ipAddress: getClientIp(req),
        });

        return NextResponse.json(booking);
    } catch (error) {
        console.error("Error updating booking:", error);
        return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
    }
}