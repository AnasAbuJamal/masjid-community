import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateStudentId } from "@/lib/utils";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const classId = searchParams.get("classId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where = classId ? { classId, isActive: true } : { isActive: true };

    const [students, total] = await Promise.all([
        prisma.student.findMany({
            where,
            include: { class: { select: { name: true } } },
            orderBy: { firstName: "asc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.student.count({ where }),
    ]);

    return NextResponse.json({ students, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const student = await prisma.student.create({
        data: {
            ...body,
            studentId: body.studentId || generateStudentId(),
        },
    });

    return NextResponse.json(student, { status: 201 });
}
