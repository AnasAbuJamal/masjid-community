import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const application = await prisma.studentApplication.create({
            data: {
                studentName: body.studentName,
                dateOfBirth: new Date(body.dateOfBirth),
                gradeLevel: body.gradeLevel,
                parentName: body.parentName,
                parentEmail: body.parentEmail,
                parentPhone: body.parentPhone,
                programName: body.programName,
                notes: body.notes,
                emergencyContactName: body.emergencyContactName,
                emergencyContactPhone: body.emergencyContactPhone,
                emergencyRelation: body.emergencyRelation,
                parentPreferredContact: body.parentPreferredContact,
                status: "pending",
            },
        });

        return NextResponse.json(application, { status: 201 });
    } catch (error) {
        console.error("Error creating student application:", error);
        return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const email = searchParams.get("email");

        if (email) {
            const applications = await prisma.studentApplication.findMany({
                where: { parentEmail: email },
                orderBy: { createdAt: "desc" },
            });
            return NextResponse.json(applications);
        }

        const applications = await prisma.studentApplication.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(applications);
    } catch (error) {
        console.error("Error fetching student applications:", error);
        return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
    }
}