import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";
import { getApiIdentity } from "@/lib/api-identity";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const stripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-01-28.clover" });
};

export async function GET(req: NextRequest) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const linked = await prisma.donation.findMany({
    where: { userId: user.id, isRecurring: true, stripeSubId: { not: null } },
    select: { stripeSubId: true, campaign: true },
    orderBy: { createdAt: "desc" }, take: 100,
  });
  const uniques = [...new Map(linked.filter(x => x.stripeSubId).map(x => [x.stripeSubId!, x])).values()].slice(0, 20);
  if (uniques.length === 0) return NextResponse.json({ donations: [] });
  try {
    const client = stripe();
    const donations = await Promise.all(uniques.map(async (item) => {
      const sub = await client.subscriptions.retrieve(item.stripeSubId!);
      const first = sub.items.data[0];
      return {
        id: sub.id,
        category: item.campaign || "General Fund",
        amount: (first?.price.unit_amount || 0) / 100,
        frequency: first?.price.recurring?.interval === "week" ? "weekly" : "monthly",
        nextDate: new Date((first?.current_period_end || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
        active: (sub.status === "active" || sub.status === "trialing") && !sub.cancel_at_period_end,
        status: sub.cancel_at_period_end ? "cancelling" : sub.status,
      };
    }));
    return NextResponse.json({ donations }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Recurring donations request failed:", error);
    return NextResponse.json({ error: "Unable to load recurring donations" }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getApiIdentity(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(`subscription-change:${getClientIp(req)}:${user.id}`, 10, 60 * 60000).success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await req.json();
  if (typeof body.subscriptionId !== "string" || !/^sub_[A-Za-z0-9]+$/.test(body.subscriptionId) ||
      body.action !== "cancel")
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const owned = await prisma.donation.findFirst({ where: {
    userId: user.id, stripeSubId: body.subscriptionId, isRecurring: true,
  }, select: { id: true } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const updated = await stripe().subscriptions.update(body.subscriptionId, { cancel_at_period_end: true });
    return NextResponse.json({ success: true, status: updated.status, cancelAtPeriodEnd: updated.cancel_at_period_end });
  } catch (error) {
    console.error("Recurring cancellation failed:", error);
    return NextResponse.json({ error: "Could not update subscription" }, { status: 503 });
  }
}
