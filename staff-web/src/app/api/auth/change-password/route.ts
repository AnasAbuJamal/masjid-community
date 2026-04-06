import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { logAudit, getClientIp } from "@/lib/audit";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { currentPassword, newPassword, confirmPassword } = await req.json();

        if (!currentPassword || !newPassword || !confirmPassword) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json({ error: "New passwords do not match" }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isCurrentValid) {
            await logAudit({
                action: "password_change_failed",
                userId: session.user.id,
                details: "Invalid current password",
                ipAddress: getClientIp(req),
                success: false,
            });
            return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }

        const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
        if (isSamePassword) {
            return NextResponse.json({ error: "New password cannot be the same as current password" }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: session.user.id },
            data: { passwordHash },
        });

        await logAudit({
            action: "password_changed",
            userId: session.user.id,
            details: "Password successfully changed",
            ipAddress: getClientIp(req),
            success: true,
        });

        return NextResponse.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        console.error("Password change error:", error);
        return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
    }
}
