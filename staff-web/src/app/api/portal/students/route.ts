import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getMobileAuthUser } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    const mobile = await getMobileAuthUser(req);
    if (!session && !mobile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const isStaff = ["admin", "teacher", "staff"].includes(session?.user.role || mobile?.role || "");
    const callerEmail = (session?.user.email || mobile?.email || "").toLowerCase();
    if (!isStaff && !callerEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = req.nextUrl;
    const studentId = searchParams.get("studentId");
    const parentEmail = isStaff ? searchParams.get("email") : callerEmail;

    if (!studentId && !parentEmail) {
        return NextResponse.json({ error: "Student ID or parent email required" }, { status: 400 });
    }

    try {
        let students;

        if (studentId) {
            const student = await prisma.student.findUnique({
                where: { id: Number(studentId) },
                include: {
                    class: true,
                    assignments: {
                        orderBy: { date: "desc" },
                        take: 10,
                    },
                },
            });
            students = student && (isStaff || student.parentEmail?.toLowerCase() === callerEmail) ? [student] : [];
        } else {
            students = await prisma.student.findMany({
                where: { parentEmail: parentEmail?.toLowerCase() },
                include: {
                    class: true,
                    assignments: {
                        orderBy: { date: "desc" },
                        take: 5,
                    },
                },
            });
        }

        if (students.length === 0) {
            return NextResponse.json({ error: "No students found" }, { status: 404 });
        }

        const result = await Promise.all(
            students.map(async (student) => {
                const recentAttendance = await prisma.attendance.findMany({
                    where: { studentId: student.id },
                    orderBy: { date: "desc" },
                    take: 30,
                });

                return {
                    id: student.id,
                    studentId: student.studentId,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    class: student.class,
                    totalPoints: student.totalPoints,
                    currentLevel: student.currentLevel,
                    attendanceRate: student.attendanceRate,
                    attendanceStatus: student.attendanceStatus,
                    recentAssignments: student.assignments.map((a) => ({
                        id: a.id,
                        date: a.date,
                        type: a.type,
                        location: a.location,
                        description: a.description,
                        status: a.status,
                        rating: a.rating,
                    })),
                    attendance: {
                        rate: student.attendanceRate,
                        status: student.attendanceStatus,
                        recentRecords: recentAttendance.slice(0, 7).map((a) => ({
                            date: a.date,
                            status: a.status,
                        })),
                        totalPresent: recentAttendance.filter((a) => a.status === "present").length,
                        totalAbsent: recentAttendance.filter((a) => a.status === "absent").length,
                        totalLate: recentAttendance.filter((a) => a.status === "late").length,
                    },
                };
            })
        );

        return NextResponse.json({
            students: result,
            isParent: !isStaff,
        }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error("Parent portal error:", error);
        return NextResponse.json({ error: "Failed to fetch student data" }, { status: 500 });
    }
}
