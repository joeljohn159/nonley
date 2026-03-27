import { STRIPE_CONFIG } from "@nonley/config";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.customer && session.subscription) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: session.customer as string },
            data: {
              stripeSubscriptionId: session.subscription as string,
              plan: "pro",
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const priceId = sub.items?.data[0]?.price?.id;
        // Map price IDs to plans (configure these in env)
        const planMap: Record<string, string> = {
          [process.env.STRIPE_PRO_PRICE_ID ?? ""]: "pro",
          [process.env.STRIPE_SITE_PRICE_ID ?? ""]: "site",
          [process.env.STRIPE_COMMUNITY_PRICE_ID ?? ""]: "community",
        };
        const plan = (priceId && planMap[priceId]) || "pro";
        if (sub.customer) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: sub.customer as string },
            data: { plan },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        if (sub.customer) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: sub.customer as string },
            data: { plan: "free", stripeSubscriptionId: null },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        // Grace period: don't downgrade immediately
        const invoice = event.data.object;
        if (invoice.customer) {
          console.warn(
            `[stripe] Payment failed for customer ${invoice.customer}. Grace period: ${STRIPE_CONFIG.GRACE_PERIOD_DAYS} days.`,
          );
          // The actual downgrade happens when subscription.deleted fires
          // after Stripe exhausts its retry attempts (configurable in Stripe dashboard)
        }
        break;
      }
    }
  } catch (error) {
    console.error("[stripe] Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
