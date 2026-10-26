import { assignmentUpdate } from "@/lib/assignment-validation";
import { utcDay } from "@/lib/attendance-validation";
import { schoolWriteError } from "@/lib/school-write-error";
import { studentScope, teachesSchool } from "@/lib/school-access";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!teachesSchool(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id < 1) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const parsed = assignmentUpdate.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid assignment update. Student and teacher cannot be reassigned." }, { status: 400 });
    const { date, ...fields } = parsed.data;
    try {
    const assignment = await prisma.assignment.update({ where: { id, student: studentScope(session.user) }, data: { ...fields, ...(date ? { date: utcDay(date) } : {}) } });
    await logAudit({ action: "update_assignment", userId: session.user.id, details: `Updated assignment ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(assignment);
    } catch (error) { return schoolWriteError(error); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!teachesSchool(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id < 1) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    try {
    await prisma.assignment.delete({ where: { id, student: studentScope(session.user) } });
    await logAudit({ action: "delete_assignment", userId: session.user.id, details: `Deleted assignment ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
    } catch (error) { return schoolWriteError(error); }
}
