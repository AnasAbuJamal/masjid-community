import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const admin = await getApiIdentity(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!rateLimit(`invoice-create:${admin.id}:${getClientIp(req)}`, 100, 60 * 60000).success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const studentId = Number(body.studentId);
  const amountCents = Number(body.amountCents);
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const dueDate = typeof body.dueDate === "string" ? new Date(body.dueDate) : new Date(NaN);
  if (!Number.isSafeInteger(studentId) || studentId <= 0 ||
      !Number.isSafeInteger(amountCents) || amountCents < 100 || amountCents > 10000000 ||
      !description || description.length > 300 || !Number.isFinite(dueDate.getTime())) {
    return NextResponse.json({
      error: "Valid student, description, due date and invoice amount ($1–$100,000) are required",
    }, { status: 400 });
  }
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const invoice = await prisma.schoolInvoice.create({
    data: { studentId, amountCents, description, dueDate, currency: "usd", status: "pending" },
    select: { id: true, amountCents: true, status: true },
  });
  await logAudit({ action: "create_school_invoice", userId: String(admin.id),
    details: `Created invoice ${invoice.id} for student ID ${studentId}`, ipAddress: getClientIp(req) });
  return NextResponse.json({ id: String(invoice.id), amountCents: invoice.amountCents, status: invoice.status },
    { status: 201 });
}

export async function GET(req: NextRequest) {
  const admin = await getApiIdentity(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [invoices, students] = await Promise.all([
    prisma.schoolInvoice.findMany({
      take: 100, orderBy: { createdAt: "desc" },
      include: { student: { select: { firstName: true, lastName: true, studentId: true } } },
    }),
    prisma.student.findMany({
      where: { isActive: true }, take: 500,
      select: { id: true, firstName: true, lastName: true, studentId: true },
      orderBy: { firstName: "asc" },
    }),
  ]);
  return NextResponse.json({ invoices, students }, { headers: { "Cache-Control": "no-store" } });
}
