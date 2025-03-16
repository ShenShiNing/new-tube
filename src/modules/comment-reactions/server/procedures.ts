import { z } from "zod";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { commentReactions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const commentReactionsRouter = createTRPCRouter({
    like: protectedProcedure
        .input(z.object({ commentId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user
            const { commentId } = input

            const [existingCommentReactionLike] = await db
                .select()
                .from(commentReactions)
                .where(and(
                    eq(commentReactions.commentId, commentId),
                    eq(commentReactions.userId, userId),
                    eq(commentReactions.type, "like")
                ))

            if (existingCommentReactionLike) {
                const [deletedViewerReaction] = await db
                    .delete(commentReactions)
                    .where(and(
                        eq(commentReactions.commentId, commentId),
                        eq(commentReactions.userId, userId),
                    ))
                    .returning()

                return deletedViewerReaction
            }

            const [createdCommentReaction] = await db
                .insert(commentReactions)
                .values({ userId, commentId, type: "like" })
                .onConflictDoUpdate({
                    target: [commentReactions.userId, commentReactions.commentId],
                    set: {
                        type: "like"
                    },
                })
                .returning()

            return createdCommentReaction
        }),
        dislike: protectedProcedure
        .input(z.object({ commentId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user
            const { commentId } = input

            const [existingCommentReactionDislike] = await db
                .select()
                .from(commentReactions)
                .where(and(
                    eq(commentReactions.commentId, commentId),
                    eq(commentReactions.userId, userId),
                    eq(commentReactions.type, "dislike")
                ))

            if (existingCommentReactionDislike) {
                const [deletedCommentReaction] = await db
                    .delete(commentReactions)
                    .where(and(
                        eq(commentReactions.commentId, commentId),
                        eq(commentReactions.userId, userId),
                    ))
                    .returning()

                return deletedCommentReaction
            }

            const [createdCommentReaction] = await db
                .insert(commentReactions)
                .values({ userId, commentId, type: "dislike" })
                .onConflictDoUpdate({
                    target: [commentReactions.userId, commentReactions.commentId],
                    set: {
                        type: "dislike"
                    },
                })
                .returning()

            return createdCommentReaction
        })
})
