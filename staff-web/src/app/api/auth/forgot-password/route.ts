import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { logAudit, getClientIp } from "@/lib/audit";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            return NextResponse.json({ 
                success: true,
                message: "If an account exists with this email, a reset link has been sent"
            });
        }

        const existingTokens = await prisma.passwordResetToken.findMany({
            where: { email: normalizedEmail },
        });

        for (const token of existingTokens) {
            if (token.expiresAt > new Date()) {
                await prisma.passwordResetToken.delete({
                    where: { id: token.id },
                });
            }
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await prisma.passwordResetToken.create({
            data: {
                email: normalizedEmail,
                token: resetToken,
                expiresAt,
            },
        });

        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

        await sendPasswordResetEmail(normalizedEmail, {
            resetToken,
            resetUrl,
            userName: `${user.firstName} ${user.lastName}`,
        });

        await logAudit({
            action: "password_reset_requested",
            email: normalizedEmail,
            userId: user.id,
            details: `Password reset requested for ${normalizedEmail}`,
            ipAddress: getClientIp(req),
            success: true,
        });

        return NextResponse.json({
            success: true,
            message: "If an account exists with this email, a reset link has been sent"
        });
    } catch (error) {
        console.error("Password reset request error:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
