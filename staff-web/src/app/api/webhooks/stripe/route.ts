import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2026-01-28.clover" });
}

function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    let event: Stripe.Event;

    try {
      event = getStripe().webhooks.constructEvent(body, signature, getWebhookSecret());
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // School tuition is never a donation. Reconcile only a fully paid Stripe session
        // against the exact invoice and amount reserved before redirecting to Stripe.
        if (session.metadata?.type === "school_invoice") {
          const invoiceId = Number(session.metadata.invoiceId);
          if (Number.isSafeInteger(invoiceId) && invoiceId > 0 &&
              session.payment_status === "paid" &&
              typeof session.payment_intent === "string") {
            const updated = await prisma.schoolInvoice.updateMany({
              where: {
                id: invoiceId,
                stripeSessionId: session.id,
                status: "pending",
                amountCents: session.amount_total ?? -1,
                currency: session.currency || "usd",
              },
              data: {
                status: "paid", stripePaymentId: session.payment_intent,
                paidAt: new Date(),
              },
            });
            if (updated.count === 0) {
              // Stripe retries completed events. A previously recorded matching payment
              // is already successful and must not cause indefinite webhook retries.
              const alreadyRecorded = await prisma.schoolInvoice.findFirst({
                where: {
                  id: invoiceId, stripeSessionId: session.id,
                  stripePaymentId: session.payment_intent, status: "paid",
                  amountCents: session.amount_total ?? -1,
                },
                select: { id: true },
              });
              if (!alreadyRecorded) {
                console.error("School invoice checkout did not match expected payment");
                return NextResponse.json({ error: "Payment reconciliation requires review" }, { status: 409 });
              }
            }
          }
          break;
        }

        const donationData = {
          stripeSessionId: session.id,
          stripePaymentId: session.payment_intent as string,
          amount: session.amount_total || 0,
          currency: session.currency || "usd",
          status: session.payment_status === "paid" ? ("completed" as const) : ("pending" as const),
          donorName: session.customer_details?.name || null,
          donorEmail: session.customer_details?.email || null,
          isAnonymous: session.metadata?.isAnonymous === "true",
          campaign: session.metadata?.campaign || "general",
          isRecurring: session.subscription ? true : false,
          stripeSubId: session.subscription as string || null,
          receiptUrl: session.customer_details?.email ? 
            `https://dashboard.stripe.com/payments/${session.payment_intent}` : null,
          metadata: session.metadata ? { ...session.metadata } : undefined,
        };

        await prisma.donation.upsert({
          where: { stripeSessionId: session.id },
          update: donationData,
          create: donationData,
        });

        console.log(`Donation checkout recorded: ${session.id}`);
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
          
          await prisma.donation.upsert({
            where: { stripeSessionId: `sub_${invoice.id}` },
            update: { status: "completed" },
            create: {
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
        if (session.metadata?.type === "school_invoice") {
          await prisma.schoolInvoice.updateMany({
            where: { stripeSessionId: session.id, status: "pending" },
            data: { stripeSessionId: null },
          });
          break;
        }

        await prisma.donation.updateMany({
          where: { stripeSessionId: session.id },
          data: { status: "failed" as const },
        });

        console.log(`Donation expired: ${session.id}`);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

        if (typeof charge.payment_intent === "string" && charge.amount_refunded >= charge.amount) {
          await prisma.schoolInvoice.updateMany({
            where: { stripePaymentId: charge.payment_intent, status: "paid" },
            data: { status: "refunded" },
          });
        }

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
