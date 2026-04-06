import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { twoFactorEnabled: true, email: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.twoFactorEnabled) {
            return NextResponse.json({
                enabled: true,
                message: "2FA is already enabled",
            });
        }

        const secret = crypto.randomBytes(20).toString("hex");
        const encodedSecret = Buffer.from(secret).toString("base64");

        const otpauthUrl = `otpauth://totp/AlMomineen:${user.email}?secret=${encodedSecret}&issuer=AlMomineen`;

        const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

        return NextResponse.json({
            enabled: false,
            secret,
            otpauthUrl,
            qrCodeUrl,
        });
    } catch (error) {
        console.error("2FA setup error:", error);
        return NextResponse.json({ error: "Failed to setup 2FA" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { secret, token } = await req.json();

        if (!secret || !token) {
            return NextResponse.json({ error: "Secret and token required" }, { status: 400 });
        }

        if (token.length !== 6 || !/^\d+$/.test(token)) {
            return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
        }

        const isValid = verifyTOTP(token, secret);

        if (!isValid) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                twoFactorEnabled: true,
                twoFactorSecret: secret,
            },
        });

        return NextResponse.json({
            success: true,
            message: "2FA has been enabled successfully",
        });
    } catch (error) {
        console.error("2FA enable error:", error);
        return NextResponse.json({ error: "Failed to enable 2FA" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { token } = await req.json();

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user?.twoFactorSecret) {
            return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
        }

        // Token is REQUIRED to disable 2FA
        if (!token) {
            return NextResponse.json({ error: "2FA token is required to disable 2FA" }, { status: 400 });
        }

        const isValid = verifyTOTP(token, user.twoFactorSecret);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
            },
        });

        return NextResponse.json({
            success: true,
            message: "2FA has been disabled",
        });
    } catch (error) {
        console.error("2FA disable error:", error);
        return NextResponse.json({ error: "Failed to disable 2FA" }, { status: 500 });
    }
}

function verifyTOTP(token: string, secret: string): boolean {
    const time = Math.floor(Date.now() / 30000);
    const expectedToken = generateTOTP(secret, time);
    return token === expectedToken;
}

function generateTOTP(secret: string, counter: number): string {
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter), 0);

    const decodedSecret = Buffer.from(secret, "base64").toString("binary");
    const hmac = crypto.createHmac("sha1", decodedSecret);
    hmac.update(counterBuffer);

    const hmacResult = hmac.digest();
    const offset = hmacResult[hmacResult.length - 1] & 0xf;
    const binary = (
        ((hmacResult[offset] & 0x7f) << 24) |
        ((hmacResult[offset + 1] & 0xff) << 16) |
        ((hmacResult[offset + 2] & 0xff) << 8) |
        (hmacResult[offset + 3] & 0xff)
    ) % 1000000;

    return binary.toString().padStart(6, "0");
}
