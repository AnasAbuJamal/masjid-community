import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!rateLimit(`student-apply:${getClientIp(req)}`, 5, 60 * 60000).success)
    return NextResponse.json({ error: "Too many applications. Try again later." }, { status: 429 });
  try {
    const body = await req.json();
    const required = ["studentName", "dateOfBirth", "gradeLevel", "parentName", "parentEmail", "parentPhone", "programName"];
    if (required.some(key => typeof body[key] !== "string" || !body[key].trim() || body[key].length > 254) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.parentEmail)) {
      return NextResponse.json({ error: "Complete all required fields" }, { status: 400 });
    }
    const dob = new Date(body.dateOfBirth);
    if (!Number.isFinite(dob.getTime()) || dob > new Date() || dob.getUTCFullYear() < 1900)
      return NextResponse.json({ error: "Invalid date of birth" }, { status: 400 });
    const application = await prisma.studentApplication.create({ data: {
      studentName: body.studentName.trim(), dateOfBirth: dob,
      gradeLevel: body.gradeLevel.trim(), parentName: body.parentName.trim(),
      parentEmail: body.parentEmail.trim().toLowerCase(), parentPhone: body.parentPhone.trim(),
      programName: body.programName.trim(), notes: typeof body.notes === "string" ? body.notes.slice(0, 2000) : null,
      emergencyContactName: typeof body.emergencyContactName === "string" ? body.emergencyContactName.slice(0, 120) : null,
      emergencyContactPhone: typeof body.emergencyContactPhone === "string" ? body.emergencyContactPhone.slice(0, 40) : null,
      emergencyRelation: typeof body.emergencyRelation === "string" ? body.emergencyRelation.slice(0, 80) : null,
      parentPreferredContact: body.parentPreferredContact === "phone" ? "phone" : "email",
      status: "pending",
    }, select: { id: true, status: true, createdAt: true } });
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("Student application error:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isVerified && user.role !== "admin") return NextResponse.json({ error: "Verify your email to access family records" }, { status: 403 });
  try {
    const admin = user.role === "admin";
    const requesterEmail = user.email;
    if (!admin && !requesterEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const applications = await prisma.studentApplication.findMany({
      where: admin ? {} : { parentEmail: requesterEmail!.toLowerCase() },
      select: { id: true, studentName: true, dateOfBirth: true, gradeLevel: true,
        parentName: true, parentEmail: true, parentPhone: true, programName: true,
        notes: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(applications, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to get applications" }, { status: 500 });
  }
}
