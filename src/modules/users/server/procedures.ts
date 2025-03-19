import { z } from "zod";
import { eq, getTableColumns, inArray, isNotNull, } from "drizzle-orm";

import { db } from "@/db";
import { TRPCError } from "@trpc/server";
import { users, videos, subscriptions } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";

export const usersRouter = createTRPCRouter({
    
    getOne: baseProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { clerkUserId } = ctx

            let userId
            const [user] = await db
                .select()
                .from(users)
                .where(inArray(users.clerId, clerkUserId ? [clerkUserId] : []))
            if (user) {
                userId = user.id
            }

            const viewerSubscriptions = db.$with("viewer_subscriptions").as(
                db
                    .select()
                    .from(subscriptions)
                    .where(inArray(subscriptions.viewer, userId ? [userId] : []))
            )

            const [existingUser] = await db
                .with(viewerSubscriptions)
                .select({
                    ...getTableColumns(users),
                    viewerSubscribed: isNotNull(viewerSubscriptions.viewer).mapWith(Boolean),
                    videoCount: db.$count(videos, eq(videos.userId, users.id)),
                    subscriberCount: db.$count(subscriptions, eq(subscriptions.creator, users.id)),
                })
                .from(users)
                .leftJoin(viewerSubscriptions, eq(viewerSubscriptions.creator, users.id))
                .where(eq(users.id, input.id))

            if (!existingUser) {
                throw new TRPCError({ code: 'NOT_FOUND' })
            }

            return existingUser
        }),
})