import { z } from "zod";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { videoReactions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const videoReactionsRouter = createTRPCRouter({
    like: protectedProcedure
        .input(z.object({ videoId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user
            const { videoId } = input

            const [existingvideoReactionLike] = await db
                .select()
                .from(videoReactions)
                .where(and(
                    eq(videoReactions.videoId, videoId),
                    eq(videoReactions.userId, userId),
                    eq(videoReactions.type, "like")
                ))

            if (existingvideoReactionLike) {
                const [deletedViewerReaction] = await db
                    .delete(videoReactions)
                    .where(and(
                        eq(videoReactions.videoId, videoId),
                        eq(videoReactions.userId, userId),
                    ))
                    .returning()

                return deletedViewerReaction
            }

            const [createdViewerReaction] = await db
                .insert(videoReactions)
                .values({ userId, videoId, type: "like" })
                .onConflictDoUpdate({
                    target: [videoReactions.userId, videoReactions.videoId],
                    set: {
                        type: "like"
                    },
                })
                .returning()

            return createdViewerReaction
        }),
        dislike: protectedProcedure
        .input(z.object({ videoId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user
            const { videoId } = input

            const [existingvideoReactionDislike] = await db
                .select()
                .from(videoReactions)
                .where(and(
                    eq(videoReactions.videoId, videoId),
                    eq(videoReactions.userId, userId),
                    eq(videoReactions.type, "dislike")
                ))

            if (existingvideoReactionDislike) {
                const [deletedViewerReaction] = await db
                    .delete(videoReactions)
                    .where(and(
                        eq(videoReactions.videoId, videoId),
                        eq(videoReactions.userId, userId),
                    ))
                    .returning()

                return deletedViewerReaction
            }

            const [createdViewerReaction] = await db
                .insert(videoReactions)
                .values({ userId, videoId, type: "dislike" })
                .onConflictDoUpdate({
                    target: [videoReactions.userId, videoReactions.videoId],
                    set: {
                        type: "dislike"
                    },
                })
                .returning()

            return createdViewerReaction
        })
})
