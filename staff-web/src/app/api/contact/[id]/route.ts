import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const body = await req.json();
        const { status, notes } = body;

        const data: Prisma.ContactSubmissionUpdateInput = {};
        if (status) data.status = status;
        if (notes !== undefined) data.notes = notes;

        const submission = await prisma.contactSubmission.update({
            where: { id },
            data,
        });

        return NextResponse.json(submission);
    } catch (error) {
        console.error("Contact update error:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
        await prisma.contactSubmission.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Contact delete error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
