import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";

export async function GET(req: NextRequest) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && !user.isVerified)
    return NextResponse.json({ error: "Verify your email to access family billing" }, { status: 403 });

  const invoices = await prisma.schoolInvoice.findMany({
    where: user.role === "admin" ? {} : { student: { parentEmail: user.email } },
    select: {
      id: true, studentId: true, description: true, amountCents: true, currency: true,
      dueDate: true, status: true, paidAt: true, createdAt: true,
      student: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ dueDate: "desc" }, { id: "desc" }], take: 150,
  });
  return NextResponse.json({ invoices: invoices.map(invoice => ({
    id: String(invoice.id), studentId: String(invoice.studentId),
    description: invoice.description, amount: invoice.amountCents / 100,
    currency: invoice.currency, dueDate: invoice.dueDate.toISOString(),
    paidDate: invoice.paidAt?.toISOString() || null,
    status: invoice.status, childName: `${invoice.student.firstName} ${invoice.student.lastName}`,
  })) }, { headers: { "Cache-Control": "private, no-store" } });
}
