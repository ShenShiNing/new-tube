import { serve } from "@upstash/workflow/nextjs"

import { db } from "@/db"
import { and, eq } from "drizzle-orm"
import { UTApi } from "uploadthing/server"
import { videos } from "@/db/schema"

interface InputType {
    userId: string,
    videoId: string,
    prompt: string
}

export const { POST } = serve(
    async (context) => {
        const utapi = new UTApi()
        const input = context.requestPayload as InputType
        const { userId, videoId, prompt } = input

        const video = await context.run("get-video", async () => {
            const [existingVideo] = await db
                .select()
                .from(videos)
                .where(and(
                    eq(videos.id, videoId),
                    eq(videos.userId, userId)
                ))

            if (!existingVideo) {
                throw new Error("Not found")
            }

            return existingVideo
        })

        // const { body } = await context.api.openai.call(
        //     "generate-description",
        //     {
        //         baseURL: "https://api.deepseek.com",
        //         token: process.env.DEEPSEEK_API_KEY!,
        //         operation: "chat.completions.create",
        //         body: {
        //             model: "deepseek-reasoner",
        //             messages: [
        //                 {
        //                     role: "system",
        //                     content: DESCRIPTION_SYSTEM_PROMPT,
        //                 },
        //                 {
        //                     role: "user",
        //                     content: transcript
        //                 }
        //             ],
        //         },
        //     }
        // );

        const { body } = await context.call<{ data: { url: string }[] }>("generate-thumbnail", {
            url: "https://api.openai.com/v1/images/generations",
            method: "POST",
            body: {
                prompt,
                n: 1,
                model: "dall-e-3",
                size: "1792x1024"
            },
            headers: {
                authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            }
        })

        const tempThumbnailUrl = body.data[0].url
        if (!tempThumbnailUrl) {
            throw new Error("Bad request")
        }

        await context.run("clearup-thumbnail", async () => {
            if (video.thumbnailKey) {
                await utapi.deleteFiles(video.thumbnailKey)
                await db
                    .update(videos)
                    .set({
                        thumbnailKey: null,
                        thumbnailUrl: null
                    })
                    .where(and(
                        eq(videos.id, videoId),
                        eq(videos.userId, userId)
                    ))
            }
        })

        const uploadedThumbnail = await context.run("upload-thumbnail", async () => {
            const { data } = await utapi.uploadFilesFromUrl(tempThumbnailUrl)

            if (!data) {
                throw new Error("Bad request")
            }

            return data
        })

        await context.run("update-video", async () => {
            await db
                .update(videos)
                .set({
                    thumbnailKey: uploadedThumbnail.key,
                    thumbnailUrl: uploadedThumbnail.ufsUrl
                })
                .where(and(
                    eq(videos.id, videoId),
                    eq(videos.userId, userId)
                ))
        })
    }
)