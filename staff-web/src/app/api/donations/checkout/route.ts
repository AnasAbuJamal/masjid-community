import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2026-01-28.clover" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, campaign, isAnonymous, isRecurring, donorEmail, donorName, successUrl, cancelUrl } = body;

    if (!amount || amount < 100) {
      return NextResponse.json({ error: "Minimum donation is $1.00" }, { status: 400 });
    }

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
          },
          quantity: 1,
        },
      ],
      mode: isRecurring ? "subscription" : "payment",
      success_url: successUrl || `${appUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${appUrl}/donate/cancel`,
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

    if (!isAnonymous && donorName) {
      sessionParams.customer = {
        name: donorName,
        email: donorEmail,
      } as unknown as string;
    }

    const session = await getStripe().checkout.sessions.create(sessionParams);

    await prisma.donation.create({
      data: {
        stripeSessionId: session.id,
        amount: Math.round(amount * 100),
        currency: "usd",
        status: "pending",
        donorName: isAnonymous ? null : donorName,
        donorEmail: isAnonymous ? null : donorEmail,
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
