import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { getApiIdentity } from "@/lib/api-identity";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

function createStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe checkout is unavailable");
  return new Stripe(key, { apiVersion: "2026-01-28.clover" });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const identity = await getApiIdentity(req);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!identity.isVerified) return NextResponse.json({ error: "Verify your email to pay invoices" }, { status: 403 });
  if (!rateLimit(`school-pay:${getClientIp(req)}:${identity.id}`, 15, 60 * 60000).success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { id: raw } = await params;
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)))
    return NextResponse.json({ error: "Invalid invoice" }, { status: 400 });
  const invoice = await prisma.schoolInvoice.findUnique({
    where: { id: Number(raw) },
    include: { student: { select: { parentEmail: true } } },
  });
  if (!invoice || invoice.student.parentEmail?.toLowerCase() !== identity.email)
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status !== "pending")
    return NextResponse.json({ error: "Invoice is not payable" }, { status: 409 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || !appUrl.startsWith("https://") || !process.env.STRIPE_SECRET_KEY)
    return NextResponse.json({ error: "Payment service is not configured" }, { status: 503 });

  try {
    const stripe = createStripe();
    if (invoice.stripeSessionId) {
      const existing = await stripe.checkout.sessions.retrieve(invoice.stripeSessionId);
      if (existing.status === "open" && existing.url)
        return NextResponse.json({ url: existing.url }, { headers: { "Cache-Control": "no-store" } });
      if (existing.status === "complete")
        return NextResponse.json({ error: "Your payment is being confirmed" }, { status: 409 });
      await prisma.schoolInvoice.updateMany({
        where: { id: invoice.id, status: "pending", stripeSessionId: invoice.stripeSessionId },
        data: { stripeSessionId: null },
      });
    }
    const session = await stripe.checkout.sessions.create({
      mode: "payment", payment_method_types: ["card"],
      customer_email: identity.email,
      line_items: [{
        price_data: {
          currency: invoice.currency,
          unit_amount: invoice.amountCents,
          product_data: { name: invoice.description.slice(0, 150) },
        },
        quantity: 1,
      }],
      success_url: `${appUrl}/?schoolPayment=success`,
      cancel_url: `${appUrl}/?schoolPayment=cancelled`,
      metadata: { type: "school_invoice", invoiceId: String(invoice.id) },
    });
    const reserved = await prisma.schoolInvoice.updateMany({
      where: { id: invoice.id, status: "pending", stripeSessionId: null },
      data: { stripeSessionId: session.id },
    });
    if (reserved.count === 0) {
      await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
      return NextResponse.json({ error: "Another payment attempt is in progress" }, { status: 409 });
    }
    return NextResponse.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("School invoice checkout failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Unable to start secure payment" }, { status: 503 });
  }
}
