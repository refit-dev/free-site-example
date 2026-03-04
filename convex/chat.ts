import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

export const getMessages = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
            .unique();

        if (!user) return [];

        return await ctx.db
            .query("messages")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();
    },
});

export const addInternalMessage = internalMutation({
    args: {
        userId: v.id("users"),
        role: v.string(),
        content: v.string(),
        reasoning_details: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("messages", args);
    },
});

export const chat = action({
    args: {
        message: v.string(),
    },
    handler: async (ctx, args): Promise<string> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.runQuery(api.users.currentUser);
        if (!user) throw new Error("User not found");

        // Persist User Message
        await ctx.runMutation(internal.chat.addInternalMessage, {
            userId: user._id,
            role: "user",
            content: args.message,
        });

        const messages = await ctx.runQuery(api.chat.getMessages);
        const chatHistory = messages.map((m: any) => ({
            role: m.role,
            content: m.content,
        }));

        const openRouterKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterKey) throw new Error("OPENROUTER_API_KEY is not set");

        const fetchResponse: Response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openRouterKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-lite-001",
                "messages": chatHistory,
            })
        });

        if (!fetchResponse.ok) {
            const errorMsg = await fetchResponse.text();
            throw new Error(`OpenRouter Error: ${errorMsg}`);
        }

        const resultBody: any = await fetchResponse.json();
        const assistantMessage = resultBody.choices[0].message;

        // Persist Assistant Message
        await ctx.runMutation(internal.chat.addInternalMessage, {
            userId: user._id,
            role: "assistant",
            content: assistantMessage.content || "",
            reasoning_details: assistantMessage.reasoning_details ? JSON.stringify(assistantMessage.reasoning_details) : undefined,
        });

        return assistantMessage.content || "";
    },
});

export const clearHistory = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
            .unique();

        if (!user) return;

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();

        for (const message of messages) {
            await ctx.db.delete(message._id);
        }
    },
});
