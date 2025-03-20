import { z } from "zod";
import { db } from "@/db";
import { and, eq, getTableColumns, lt, desc, or } from "drizzle-orm";
import { subscriptions, users } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const subscriptionsRouter = createTRPCRouter({
    getMany: protectedProcedure
        .input(
            z.object({
                cursor: z.object({
                    creator: z.string().uuid(),
                    updatedAt: z.date(),
                }).nullish(),
                limit: z.number().min(1).max(100),
            })
        )
        .query(async ({ input, ctx }) => {
            const { cursor, limit } = input
            const { id: userId } = ctx.user

            const data = await db
                .select({
                    ...getTableColumns(subscriptions),
                    user: {
                        ...getTableColumns(users),
                        subscriberCount: db.$count(
                            subscriptions,
                            eq(subscriptions.creator, users.id)
                        )
                    },
                })
                .from(subscriptions)
                .innerJoin(users, eq(subscriptions.creator, users.id))
                .where(and(
                    eq(subscriptions.viewer, userId),
                    cursor
                        ? or(
                            lt(subscriptions.updatedAt, cursor.updatedAt),
                            and(
                                eq(subscriptions.updatedAt, cursor.updatedAt),
                                lt(subscriptions.creator, cursor.creator)
                            )
                        )
                        : undefined
                ))
                .orderBy(desc(users.updatedAt), desc(users.id))
                // Add 1 to the limit to check if there is more data
                .limit(limit + 1)

            const hasMore = data.length > limit
            // Remove the last item if there is more data
            const items = hasMore ? data.slice(0, -1) : data
            // Set the next cursor to the last item if there is more data
            const lastItem = items[items.length - 1]
            const nextCursor = hasMore
                ? {
                    creator: lastItem.creator,
                    updatedAt: lastItem.updatedAt
                }
                : null

            return {
                items,
                nextCursor
            }
        }),
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
