import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2026-01-28.clover" });
}

export async function POST(req: NextRequest) {
  try {
    const parsed = z.object({
      amount: z.number().finite().min(1).max(100000),
      campaign: z.enum(["general", "construction", "ramadan", "education", "zakat", "sadaqah"]).default("general"),
      isAnonymous: z.boolean().default(false), isRecurring: z.boolean().default(false),
      frequency: z.enum(["weekly", "monthly"]).default("monthly"),
      donorEmail: z.string().email().optional(), donorName: z.string().trim().max(150).optional(),
    }).safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid donation amount (minimum $1.00) and campaign" }, { status: 400 });
    const { amount, campaign, isAnonymous, isRecurring, donorEmail, donorName, frequency } = parsed.data;
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Online donations are not configured yet. Please contact the masjid." }, { status: 503 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: campaign === "construction" ? "Masjid Construction Fund" :
                     campaign === "ramadan" ? "Ramadan Fund" :
                     campaign === "education" ? "Education Fund" :
                     campaign === "zakat" ? "Zakat" :
                     campaign === "sadaqah" ? "Sadaqah" : "General Donation",
              description: `Donation to Al-Momineen - ${campaign || "General Fund"}`,
            },
            unit_amount: Math.round(amount * 100),
            ...(isRecurring ? { recurring: { interval: frequency === "weekly" ? "week" as const : "month" as const } } : {}),
          },
          quantity: 1,
        },
      ],
      mode: isRecurring ? "subscription" : "payment",
      success_url: `${appUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/donate/cancel`,
      metadata: {
        campaign: campaign || "general",
        isAnonymous: isAnonymous ? "true" : "false",
      },
    };

    if (isRecurring) {
      sessionParams.subscription_data = {
        metadata: {
          campaign: campaign || "general",
          isAnonymous: isAnonymous ? "true" : "false",
        },
      };
    }

    if (!isAnonymous && donorEmail) {
      sessionParams.customer_email = donorEmail;
    }

    const session = await getStripe().checkout.sessions.create(sessionParams);

    await prisma.donation.create({
      data: {
        stripeSessionId: session.id,
        amount: Math.round(amount * 100),
        currency: "usd",
        status: "pending",
        donorName: isAnonymous ? null : donorName || null,
        donorEmail: isAnonymous ? null : donorEmail || null,
        isAnonymous: isAnonymous || false,
        campaign: campaign || "general",
        isRecurring: isRecurring || false,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Create donation checkout session",
    usage: "POST with { amount, campaign, isAnonymous, isRecurring, donorEmail, donorName }"
  });
}
