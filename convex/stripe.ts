import { v } from "convex/values";
import { action } from "./_generated/server";
import Stripe from "stripe";

export const createCheckoutSession = action({
    args: {
        origin: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY not set in Convex environment");
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2026-09-30.endive",
        });

        console.log("Creating checkout session for user:", identity.subject);

        const session = await stripe.checkout.sessions.create({
            allowed_payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "Unlimited Use Plan",
                        },
                        unit_amount: 1999, // $19.99
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${args.origin}/dashboard?success=true`,
            cancel_url: `${args.origin}/dashboard?canceled=true`,
            client_reference_id: identity.subject,
            customer_email: identity.email,
        });

        return session.url;
    },
});
