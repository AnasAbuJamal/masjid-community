import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const donationData = {
          stripeSessionId: session.id,
          stripePaymentId: session.payment_intent as string,
          amount: session.amount_total || 0,
          currency: session.currency || "usd",
          status: "completed" as const,
          donorName: session.customer_details?.name || null,
          donorEmail: session.customer_details?.email || null,
          isAnonymous: session.metadata?.isAnonymous === "true",
          campaign: session.metadata?.campaign || "general",
          isRecurring: session.subscription ? true : false,
          stripeSubId: session.subscription as string || null,
          receiptUrl: session.customer_details?.email ? 
            `https://dashboard.stripe.com/payments/${session.payment_intent}` : null,
          metadata: session.metadata || null,
        };

        await prisma.donation.upsert({
          where: { stripeSessionId: session.id },
          update: donationData,
          create: donationData,
        });

        console.log(`Donation completed: ${session.id}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string; payment_intent?: string | null };
        
        if (invoice.subscription) {
          const subscription = invoice.subscription as string;
          
          await prisma.donation.updateMany({
            where: { stripeSubId: subscription },
            data: { status: "completed" as const },
          });

          const subscriptionDetails = invoice.lines?.data[0];
          
          await prisma.donation.create({
            data: {
              stripeSessionId: `sub_${invoice.id}`,
              stripePaymentId: invoice.payment_intent as string,
              amount: subscriptionDetails?.amount || 0,
              currency: invoice.currency || "usd",
              status: "completed" as const,
              isRecurring: true,
              stripeSubId: subscription,
              campaign: invoice.metadata?.campaign || "general",
              receiptUrl: `https://dashboard.stripe.com/invoices/${invoice.id}`,
            },
          });

          console.log(`Recurring donation: ${invoice.id}`);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        await prisma.donation.update({
          where: { stripeSessionId: session.id },
          data: { status: "failed" as const },
        });

        console.log(`Donation expired: ${session.id}`);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        
        if (charge.payment_intent) {
          await prisma.donation.updateMany({
            where: { stripePaymentId: charge.payment_intent as string },
            data: { status: "refunded" as const },
          });
        }

        console.log(`Donation refunded: ${charge.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Stripe webhook endpoint",
    events: ["checkout.session.completed", "invoice.payment_succeeded", "checkout.session.expired", "charge.refunded"]
  });
}
