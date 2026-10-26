import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2026-01-28.clover" });
}

const campaignNames: Record<string, string> = {
  construction: "Masjid Construction Fund",
  ramadan: "Ramadan Fund",
  education: "Education Fund",
  zakat: "Zakat",
  sadaqah: "Sadaqah",
  general: "General Donation",
};

export async function POST(req: NextRequest) {
  if (!rateLimit(`donate:${getClientIp(req)}`, 20, 60 * 60000).success)
    return NextResponse.json({ error: "Please try again later" }, { status: 429 });
  try {
    const body = await req.json();
    const { amount, campaign, isAnonymous, isRecurring, donorEmail, donorName, recurringFrequency } = body;
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 1 || amount > 100000 ||
        Math.round(amount * 100) !== amount * 100) {
      return NextResponse.json({ error: "Donation amount must be between $1 and $100,000 (up to two decimals)" }, { status: 400 });
    }
    if (donorEmail && (typeof donorEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)))
      return NextResponse.json({ error: "Invalid donor email" }, { status: 400 });
    const chosenCampaign = typeof campaign === "string" && campaign in campaignNames ? campaign : "general";
    const frequency = recurringFrequency === "weekly" ? "week" : "month";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl || !/^https:\/\//.test(appUrl)) {
      return NextResponse.json({ error: "Payment system is not configured" }, { status: 503 });
    }
    const cents = Math.round(amount * 100);
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: isRecurring ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: campaignNames[chosenCampaign],
            description: `Donation to Al-Momineen — ${campaignNames[chosenCampaign]}` },
          unit_amount: cents,
          ...(isRecurring ? { recurring: { interval: frequency } } : {}),
        },
        quantity: 1,
      }],
      success_url: `${appUrl}/?donation=success`,
      cancel_url: `${appUrl}/?donation=cancelled`,
      metadata: { campaign: chosenCampaign, isAnonymous: isAnonymous ? "true" : "false" },
      ...(isRecurring ? { subscription_data: { metadata: { campaign: chosenCampaign,
        isAnonymous: isAnonymous ? "true" : "false" } } } : {}),
    };
    if (!isAnonymous && donorEmail) params.customer_email = donorEmail.trim().toLowerCase();
    const session = await getStripe().checkout.sessions.create(params);
    await prisma.donation.create({ data: {
      stripeSessionId: session.id, amount: cents, currency: "usd", status: "pending",
      donorName: isAnonymous ? null : (typeof donorName === "string" ? donorName.slice(0, 100) : null),
      donorEmail: isAnonymous ? null : (donorEmail || null), isAnonymous: !!isAnonymous,
      campaign: chosenCampaign, isRecurring: !!isRecurring,
    } });
    return NextResponse.json({ sessionId: session.id, url: session.url }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Unable to start secure checkout" }, { status: 500 });
  }
}
