import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { optionalEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

/**
 * Stripe subscription lifecycle. Not reachable through the session/secret
 * gate in src/proxy.ts's `/api/webhooks` allowlist — verification here is
 * Stripe's own signature check instead, same principle as
 * verifyWebhookSecret() in src/lib/security.ts for the n8n-facing routes.
 *
 * Returns 200 with a "not configured" body rather than 404 when Stripe
 * isn't set up yet, so Stripe's dashboard (once you do add a real endpoint)
 * doesn't see a hard failure during the scaffolding period.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = optionalEnv("STRIPE_WEBHOOK_SECRET");
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ received: false, reason: "Stripe not configured" });
  }

  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[stripe-webhook] Signature verification failed:", detail);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clientId = session.client_reference_id || session.metadata?.client_id;
        const planKey = session.metadata?.plan_key;
        if (!clientId || typeof session.customer !== "string") break;

        await prisma.$transaction([
          prisma.client.update({ where: { id: clientId }, data: { status: "ACTIVE" } }),
          prisma.subscription.upsert({
            where: { clientId },
            update: {
              stripeCustomerId: session.customer,
              stripeSubId: typeof session.subscription === "string" ? session.subscription : null,
              planKey: planKey || "starter",
              status: "ACTIVE",
            },
            create: {
              clientId,
              stripeCustomerId: session.customer,
              stripeSubId: typeof session.subscription === "string" ? session.subscription : null,
              planKey: planKey || "starter",
              status: "ACTIVE",
            },
          }),
        ]);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const existing = await prisma.subscription.findUnique({
          where: { stripeCustomerId: sub.customer as string },
        }).catch(() => null);
        if (!existing) break;

        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            status: sub.status.toUpperCase(),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodEnd: sub.items.data[0]?.current_period_end
              ? new Date(sub.items.data[0].current_period_end * 1000)
              : null,
          },
        });
        if (sub.status === "canceled" || sub.status === "unpaid") {
          await prisma.client.update({
            where: { id: existing.clientId },
            data: { status: "SUSPENDED" },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
        if (!customerId) break;
        const existing = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        }).catch(() => null);
        if (existing) {
          await prisma.client.update({
            where: { id: existing.clientId },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe-webhook] Handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
