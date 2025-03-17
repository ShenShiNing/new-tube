import { z } from "zod";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { subscriptions } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const subscriptionsRouter = createTRPCRouter({
    create: protectedProcedure
        .input(z.object({ userId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { userId } = input

            if (userId === ctx.user.id) {
                throw new TRPCError({ code: "BAD_REQUEST" })
            }

            const [createdSubscription] = await db
                .insert(subscriptions)
                .values({ viewer: ctx.user.id, creator: userId })
                .returning()

            return createdSubscription
        }),
    remove: protectedProcedure
        .input(z.object({ userId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { userId } = input

            if (userId === ctx.user.id) {
                throw new TRPCError({ code: "BAD_REQUEST" })
            }

            const [deletedSubscription] = await db
                .delete(subscriptions)
                .where(and(
                    eq(subscriptions.viewer, ctx.user.id),
                    eq(subscriptions.creator, userId)
                ))
                .returning()

            return deletedSubscription
        })
})
