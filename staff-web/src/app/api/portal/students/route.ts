import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const studentId = searchParams.get("studentId");
    const parentEmail = searchParams.get("email");

    if (!studentId && !parentEmail) {
        return NextResponse.json({ error: "Student ID or parent email required" }, { status: 400 });
    }

    try {
        let students;

        if (studentId) {
            const student = await prisma.student.findUnique({
                where: { id: studentId },
                include: {
                    class: true,
                    assignments: {
                        orderBy: { date: "desc" },
                        take: 10,
                    },
                },
            });
            students = student ? [student] : [];
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
            isParent: true,
        });
    } catch (error) {
        console.error("Parent portal error:", error);
        return NextResponse.json({ error: "Failed to fetch student data" }, { status: 500 });
    }
}
