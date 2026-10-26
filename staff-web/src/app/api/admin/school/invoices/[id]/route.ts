import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getApiIdentity(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: raw } = await params;
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) <= 0)
    return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
  const data = await req.json().catch(() => null);
  if (!data || Object.keys(data).length !== 1 || data.action !== "void")
    return NextResponse.json({ error: "Only voiding pending invoices is supported" }, { status: 400 });
  const invoice = await prisma.schoolInvoice.findUnique({ where: { id: Number(raw) } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.status !== "pending") return NextResponse.json({ error: "Invoice is no longer pending" }, { status: 409 });
  if (invoice.stripeSessionId)
    return NextResponse.json({ error: "This invoice has an active or unresolved payment attempt. Reconcile it in Stripe before voiding." }, { status: 409 });
  const result = await prisma.schoolInvoice.updateMany({
    where: { id: invoice.id, status: "pending", stripeSessionId: null },
    data: { status: "void" },
  });
  if (result.count !== 1) return NextResponse.json({ error: "Invoice changed, refresh and try again" }, { status: 409 });
  await logAudit({ action: "void_school_invoice", userId: String(admin.id),
    details: `Voided invoice ${invoice.id}`, ipAddress: getClientIp(req) });
  return NextResponse.json({ success: true });
}
