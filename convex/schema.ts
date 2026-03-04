import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    externalId: v.string(), // This will be the Clerk user's ID
    isPro: v.optional(v.boolean()),
  }).index("by_externalId", ["externalId"]),
  messages: defineTable({
    userId: v.id("users"),
    role: v.string(), // "user" or "assistant"
    content: v.string(),
    reasoning_details: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
  numbers: defineTable({
    value: v.number(),
  }),
});
