import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    if (body.classId !== undefined) body.classId = parseInt(String(body.classId));
    if (body.studentId !== undefined) body.studentId = parseInt(String(body.studentId));
    if (body.totalPoints !== undefined) body.totalPoints = parseInt(String(body.totalPoints));
    if (body.currentLevel !== undefined) body.currentLevel = parseInt(String(body.currentLevel));
    if (body.attendanceRate !== undefined) body.attendanceRate = parseFloat(String(body.attendanceRate));

    const student = await prisma.student.update({ 
        where: { id: parseInt(id) }, 
        data: body 
    });
    await logAudit({ action: "update_student", userId: session.user.id, details: `Updated student ${id}`, ipAddress: getClientIp(req) });
    return NextResponse.json(student);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.student.update({ 
        where: { id: parseInt(id) }, 
        data: { isActive: false } 
    });
    await logAudit({ action: "deactivate_student", userId: session.user.id, details: `Deactivated student ${id}`, ipAddress: getClientIp(_req) });
    return NextResponse.json({ success: true });
}
