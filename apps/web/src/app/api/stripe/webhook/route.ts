import { STRIPE_CONFIG } from "@nonley/config";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Track recently processed event IDs to prevent duplicate processing.
// In production, this should be backed by a database or Redis.
const processedEvents = new Map<string, number>();
const DEDUP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Clean up stale entries periodically
setInterval(() => {
  const cutoff = Date.now() - DEDUP_WINDOW_MS;
  for (const [key, ts] of processedEvents) {
    if (ts < cutoff) {
      processedEvents.delete(key);
    }
  }
}, 10 * 60_000);

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

  // Idempotency: skip duplicate webhook deliveries
  if (processedEvents.has(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }
  processedEvents.set(event.id, Date.now());

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
          console.log(
            `[stripe] Checkout completed: customer=${session.customer}`,
          );
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
          console.log(
            `[stripe] Subscription updated: customer=${sub.customer} plan=${plan}`,
          );
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
          console.log(
            `[stripe] Subscription cancelled: customer=${sub.customer}`,
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        // Grace period: don't downgrade immediately
        const invoice = event.data.object;
        if (invoice.customer) {
          console.warn(
            `[stripe] Payment failed: customer=${invoice.customer} grace_period=${STRIPE_CONFIG.GRACE_PERIOD_DAYS}d`,
          );
          // The actual downgrade happens when subscription.deleted fires
          // after Stripe exhausts its retry attempts (configurable in Stripe dashboard)
        }
        break;
      }
    }
  } catch (error) {
    console.error(
      `[stripe] Webhook handler error: event=${event.type} id=${event.id}`,
      error,
    );
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
