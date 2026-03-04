import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const storeUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called storeUser without authentication");
        }

        // Check if the user already exists.
        const user = await ctx.db
            .query("users")
            .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
            .unique();

        if (user !== null) {
            // If we've seen this user before but their name or email has changed, update them.
            if (user.name !== identity.name || user.email !== identity.email) {
                await ctx.db.patch(user._id, {
                    name: identity.name,
                    email: identity.email,
                });
            }
            return user._id;
        }

        // If it's a new user, create them.
        return await ctx.db.insert("users", {
            name: identity.name,
            email: identity.email,
            externalId: identity.subject,
        });
    },
});

export const currentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        return await ctx.db
            .query("users")
            .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
            .unique();
    },
});

export const updateProStatus = internalMutation({
    args: {
        externalId: v.string(),
        isPro: v.boolean(),
    },
    handler: async (ctx, args) => {
        console.log("Searching for user with externalId:", args.externalId);
        const user = await ctx.db
            .query("users")
            .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
            .unique();

        if (user) {
            console.log("Found user! Patching isPro to:", args.isPro);
            await ctx.db.patch(user._id, { isPro: args.isPro });
        } else {
            console.warn("No user found with externalId:", args.externalId);
        }
    },
});
