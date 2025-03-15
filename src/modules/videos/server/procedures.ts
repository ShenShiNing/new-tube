import { z } from "zod";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";

import { TRPCError } from "@trpc/server";
import { UTApi } from "uploadthing/server";

import { mux } from "@/lib/mux";
import { workflow } from "@/lib/workflow"
import { videos, videoUpdateSchema } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const videosRouter = createTRPCRouter({

    generateDescription: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user

            const { workflowRunId } = await workflow.trigger({
                url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflow/description`,
                body: { userId, videoId: input.id },
            })

            return workflowRunId
        }),
    generateTitle: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user

            const { workflowRunId } = await workflow.trigger({
                url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflow/title`,
                body: { userId, videoId: input.id },
            })

            return workflowRunId
        }),
    generateThumbnail: protectedProcedure
        .input(z.object({ id: z.string().uuid(), prompt: z.string().min(10) }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user

            const { workflowRunId } = await workflow.trigger({
                url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflow/thumbnail`,
                body: { userId, videoId: input.id, prompt: input.prompt },
            })

            return workflowRunId
        }),
    restoreThumbnail: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user
            const [existingVideo] = await db
                .select()
                .from(videos)
                .where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId)
                ))

            if (!existingVideo) {
                throw new TRPCError({ code: 'NOT_FOUND' })
            }

            if (existingVideo.thumbnailKey) {
                const utapi = new UTApi()

                await utapi.deleteFiles(existingVideo.thumbnailKey)
                await db
                    .update(videos)
                    .set({
                        thumbnailKey: null,
                        thumbnailUrl: null
                    })
                    .where(and(
                        eq(videos.id, input.id),
                        eq(videos.userId, userId),
                    ))
            }

            if (!existingVideo.muxPalybackId) {
                throw new TRPCError({ code: 'BAD_REQUEST' })
            }

            const utapi = new UTApi()

            const tempThumbnailUrl = `https://image.mux.com/${existingVideo.muxPalybackId}/thumbnail.jpg`
            const uploadedThumbnail = await utapi.uploadFilesFromUrl(tempThumbnailUrl)

            if (!uploadedThumbnail.data) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
            }

            const { key: thumbnailKey, ufsUrl: thumbnailUrl } = uploadedThumbnail.data

            const [updatedVdeio] = await db
                .update(videos)
                .set({
                    thumbnailUrl,
                    thumbnailKey
                })
                .where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId)
                ))
                .returning()
            return updatedVdeio
        }),
    remove: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user
            const [removedVideo] = await db
                .delete(videos)
                .where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId)
                ))
                .returning()

            if (!removedVideo) {
                throw new TRPCError({ code: 'NOT_FOUND' })
            }

            return removedVideo
        }),
    update: protectedProcedure
        .input(videoUpdateSchema)
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user

            if (!input.id) {
                throw new TRPCError({ code: 'BAD_REQUEST' })
            }

            const [updatedVdeio] = await db
                .update(videos)
                .set({
                    title: input.title,
                    description: input.description,
                    categoryId: input.categoryId,
                    visibility: input.visibility,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId)
                ))
                .returning()

            if (!updatedVdeio) {
                throw new TRPCError({ code: 'NOT_FOUND' })
            }

            return updatedVdeio
        }),
    create: protectedProcedure
        .mutation(async ({ ctx }) => {
            const { id: userId } = ctx.user

            const upload = await mux.video.uploads.create({
                new_asset_settings: {
                    passthrough: userId,
                    playback_policy: ['public'],
                    input: [
                        {
                            generated_subtitles: [
                                {
                                    language_code: 'en',
                                    name: 'English'
                                }
                            ]
                        }
                    ]
                },
                cors_origin: '*' // TODO: In production, set to your url
            })

            const [video] = await db
                .insert(videos)
                .values({
                    userId,
                    title: 'UnTitled',
                    muxStatus: 'waiting',
                    muxUploadId: upload.id,

                })
                .returning()

            return {
                video: video,
                url: upload.url
            }
        })
})