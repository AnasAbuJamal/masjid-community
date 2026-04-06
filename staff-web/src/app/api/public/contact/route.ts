import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { name, email, phone, subject, message } = await req.json();

        if (!name || !email || !subject || !message) {
            return NextResponse.json({ error: "Name, email, subject, and message are required" }, { status: 400 });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
        }

        if (message.length < 10) {
            return NextResponse.json({ error: "Message must be at least 10 characters" }, { status: 400 });
        }

        const submission = await prisma.contactSubmission.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                phone: phone?.trim() || null,
                subject: subject.trim(),
                message: message.trim(),
                status: "pending",
            },
        });

        return NextResponse.json({
            success: true,
            message: "Thank you for your message. We will get back to you soon!",
            reference: submission.id.slice(-8).toUpperCase(),
        }, { status: 201 });
    } catch (error) {
        console.error("Public contact form error:", error);
        return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
    }
}
