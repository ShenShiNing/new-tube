import { z } from "zod";
import { db } from "@/db";
import { and, or, eq, lt, desc, getTableColumns, count, inArray, isNull, isNotNull } from "drizzle-orm";
import { comments, users, commentReactions } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const commentsRouter = createTRPCRouter({
    remove: protectedProcedure
        .input(z.object({
            id: z.string().uuid(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user
            const { id: commentId } = input

            const [deletedComment] = await db
                .delete(comments)
                .where(and(
                    eq(comments.id, commentId),
                    eq(comments.userId, userId)
                ))
                .returning()

            if (!deletedComment) {
                throw new TRPCError({ code: "NOT_FOUND" })
            }

            return deletedComment
        }),
    create: protectedProcedure
        .input(z.object({
            parentId: z.string().uuid().nullish(),
            videoId: z.string().uuid(),
            value: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user
            const { videoId, value, parentId } = input

            const [existingComment] = await db
                .select()
                .from(comments)
                .where(inArray(comments.id, parentId ? [parentId] : []))

            if (!existingComment && parentId) {
                throw new TRPCError({ code: "NOT_FOUND" })
            }

            if (existingComment?.parentId && parentId) {
                throw new TRPCError({ code: "BAD_REQUEST" })
            }

            const [createdComment] = await db
                .insert(comments)
                .values({ userId, videoId, value, parentId })
                .returning()

            return createdComment
        }),
    getMany: baseProcedure
        .input(z.object({
            videoId: z.string().uuid(),
            parentId: z.string().uuid().nullish(),
            cursor: z.object({
                id: z.string().uuid(),
                updatedAt: z.date()
            }).nullish(),
            limit: z.number().min(1).max(100)
        }))
        .query(async ({ ctx, input }) => {
            const { clerkUserId } = ctx
            const { videoId, cursor, limit, parentId } = input

            let userId
            const [user] = await db
                .select()
                .from(users)
                .where(inArray(users.clerId, clerkUserId ? [clerkUserId] : []))

            if (user) {
                userId = user.id
            }

            const viewerReactions = db.$with("viewer_reactions").as(
                db
                    .select({
                        commentId: commentReactions.commentId,
                        type: commentReactions.type
                    })
                    .from(commentReactions)
                    .where(inArray(commentReactions.userId, userId ? [userId] : []))
            )

            const replies = db.$with("replies").as(
                db
                    .select({
                        parentId: comments.parentId,
                        count: count(comments.id).as("count")
                    })
                    .from(comments)
                    .where(isNotNull(comments.parentId))
                    .groupBy(comments.parentId)
            )

            const [totalData, data] = await Promise.all([
                db
                    .select({
                        count: count()
                    })
                    .from(comments)
                    .where(and(
                        eq(comments.videoId, videoId),
                        // isNull(comments.parentId)
                    )),

                db
                    .with(viewerReactions, replies)
                    .select({
                        ...getTableColumns(comments),
                        user: users,
                        viewerReaction: viewerReactions.type,
                        replyCount: replies.count,
                        likeCount: db.$count(
                            commentReactions,
                            and(
                                eq(commentReactions.commentId, comments.id),
                                eq(commentReactions.type, "like")
                            )
                        ),
                        dislikeCount: db.$count(
                            commentReactions,
                            and(
                                eq(commentReactions.commentId, comments.id),
                                eq(commentReactions.type, "dislike")
                            )
                        )
                    })
                    .from(comments)
                    .where(
                        and(
                            eq(comments.videoId, videoId),
                            parentId 
                            ? eq(comments.parentId, parentId) 
                            : isNull(comments.parentId),
                            cursor
                                ? or(
                                    lt(comments.updatedAt, cursor.updatedAt),
                                    and(
                                        eq(comments.updatedAt, cursor.updatedAt),
                                        lt(comments.id, cursor.id)
                                    )
                                )
                                : undefined
                        )
                    )
                    .innerJoin(users, eq(comments.userId, users.id))
                    .leftJoin(viewerReactions, eq(viewerReactions.commentId, comments.id))
                    .leftJoin(replies, eq(replies.parentId, comments.id))
                    .orderBy(desc(comments.updatedAt), desc(comments.id))
                    .limit(limit + 1)
            ])

            const hasMore = data.length > limit
            // Remove the last item if there is more data
            const items = hasMore ? data.slice(0, -1) : data
            // Set the next cursor to the last item if there is more data
            const lastItem = items[items.length - 1]
            const nextCursor = hasMore
                ? {
                    id: lastItem.id,
                    updatedAt: lastItem.updatedAt
                }
                : null

            return {
                items,
                nextCursor,
                totalCount: totalData[0].count
            }
        })
})
