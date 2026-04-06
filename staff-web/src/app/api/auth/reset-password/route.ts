import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAudit, getClientIp } from "@/lib/audit";

export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }
        
        // Strength requirements: uppercase, lowercase, number, special char
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[@$!%*?&]/.test(password);
        
        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            return NextResponse.json({ 
                error: "Password must contain: uppercase, lowercase, number, and special character (@$!%*?&)" 
            }, { status: 400 });
        }
        
        // Check for common passwords
        const commonPasswords = ['password', 'password123', 'qwerty', 'admin123', 'letmein'];
        if (commonPasswords.includes(password.toLowerCase())) {
            return NextResponse.json({ error: "Password is too common. Please choose a stronger password." }, { status: 400 });
        }

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!resetToken) {
            return NextResponse.json({ error: "Invalid reset token" }, { status: 400 });
        }

        if (resetToken.expiresAt < new Date()) {
            await prisma.passwordResetToken.delete({
                where: { id: resetToken.id },
            });
            return NextResponse.json({ error: "Reset token has expired" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: resetToken.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isSamePassword = await bcrypt.compare(password, user.passwordHash);
        if (isSamePassword) {
            return NextResponse.json({ error: "New password cannot be the same as current password" }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });

        await prisma.passwordResetToken.deleteMany({
            where: { email: resetToken.email },
        });

        await logAudit({
            action: "password_reset_completed",
            email: resetToken.email,
            userId: user.id,
            details: "Password successfully reset",
            ipAddress: getClientIp(req),
            success: true,
        });

        return NextResponse.json({
            success: true,
            message: "Password has been reset successfully"
        });
    } catch (error) {
        console.error("Password reset error:", error);
        return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
    }
}
