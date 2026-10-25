import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";

const http = httpRouter();

export const stripeWebhook = httpAction(async (ctx, request) => {
    console.log("Webhook received!");
    const signature: string = request.headers.get("stripe-signature") as string;
    const body: string = await request.text();

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
        console.error("Missing Stripe configuration in Convex Environment");
        return new Response("Config missing", { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2026-09-30.endive",
    });

    try {
        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        console.log("Event verified:", event.type);

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const externalId = session.client_reference_id;
            console.log("Found externalId in session:", externalId);

            if (externalId) {
                console.log("Updating Pro status for:", externalId);
                await ctx.runMutation(internal.users.updateProStatus, {
                    externalId,
                    isPro: true,
                });
                console.log("Mutation completed successfully");
            } else {
                console.warn("No client_reference_id found in session metadata");
            }
        }

        return new Response(null, { status: 200 });
    } catch (err) {
        console.error("Webhook Verification Error:", (err as any).message);
        return new Response(`Webhook Error: ${(err as any).message}`, { status: 400 });
    }
});

http.route({
    path: "/stripe-webhook",
    method: "POST",
    handler: stripeWebhook,
});

export default http;
