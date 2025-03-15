import { db } from "@/db"
import { eq } from "drizzle-orm"
import { mux } from "@/lib/mux"
import { headers } from "next/headers"
import { UTApi } from "uploadthing/server";
import { videos } from "@/db/schema"
import {
    VideoAssetCreatedWebhookEvent,
    VideoAssetDeletedWebhookEvent,
    VideoAssetErroredWebhookEvent,
    VideoAssetReadyWebhookEvent,
    VideoAssetTrackReadyWebhookEvent
} from "@mux/mux-node/resources/webhooks"

const SIGNING_SECRET = process.env.MUX_WEBHOOK_SECRET!

type WebhookEvent =
    | VideoAssetCreatedWebhookEvent
    | VideoAssetErroredWebhookEvent
    | VideoAssetReadyWebhookEvent
    | VideoAssetTrackReadyWebhookEvent
    | VideoAssetDeletedWebhookEvent

export const POST = async (request: Request) => {
    if (!SIGNING_SECRET) {
        throw new Error('MUX_WEBHOOK_SECERT is not set')
    }

    const headerPayload = await headers()
    const muxSignature = headerPayload.get('mux-signature')

    if (!muxSignature) {
        return new Response('No signature fount', { status: 401 })
    }

    const payload = await request.json()
    const body = JSON.stringify(payload)

    mux.webhooks.verifySignature(
        body,
        { "mux-signature": muxSignature },
        SIGNING_SECRET
    )

    switch (payload.type as WebhookEvent['type']) {
        case 'video.asset.created': {
            const data = payload.data as VideoAssetCreatedWebhookEvent['data']

            if (!data.upload_id) {
                return new Response("No upload ID fount", { status: 400 })
            }

            console.log('Creating video:', data.upload_id);

            await db
                .update(videos)
                .set({
                    muxAssetId: data.id,
                    muxStatus: data.status
                })
                .where(eq(videos.muxUploadId, data.upload_id))
            break
        }
        case 'video.asset.ready': {
            const data = payload.data as VideoAssetCreatedWebhookEvent['data']
            const playbackId = data.playback_ids?.[0].id

            if (!data.upload_id) {
                return new Response("Missing upload ID", { status: 400 })
            }

            if (!playbackId) {
                return new Response("Missing playback ID", { status: 400 })
            }

            const tempthumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`
            const temppreviewUrl = `https://image.mux.com/${playbackId}/animated.gif`

            const utapi = new UTApi()
            const [
                uploadedThumbnail,
                uploadedPreview
            ] = await utapi.uploadFilesFromUrl([
                tempthumbnailUrl,
                temppreviewUrl
            ])

            if (!uploadedThumbnail.data || !uploadedPreview.data) {
                return new Response("Failed to upload thumbnail or preview", { status: 500 })
            }

            const { key: thumbnailKey, ufsUrl: thumbnailUrl } = uploadedThumbnail.data
            const { key: previewKey, ufsUrl: previewUrl } = uploadedPreview.data

            const duration = data.duration ? Math.round(data.duration * 1000) : 0

            await db
                .update(videos)
                .set({
                    muxStatus: data.status,
                    muxPalybackId: playbackId,
                    muxAssetId: data.id,
                    thumbnailUrl,
                    thumbnailKey,
                    previewUrl,
                    previewKey,
                    duration
                })
                .where(eq(videos.muxUploadId, data.upload_id))
            break
        }
        case 'video.asset.errored': {
            const data = payload.data as VideoAssetErroredWebhookEvent['data']

            if (!data.upload_id) {
                return new Response("Missing upload ID", { status: 400 })
            }

            await db
                .update(videos)
                .set({
                    muxStatus: data.status
                })
                .where(eq(videos.muxUploadId, data.upload_id))
            break
        }
        case 'video.asset.deleted': {
            const data = payload.data as VideoAssetDeletedWebhookEvent['data']

            if (!data.upload_id) {
                return new Response("Missing upload ID", { status: 400 })
            }

            console.log('Deleting video:', data.upload_id);

            await db
                .delete(videos)
                .where(eq(videos.muxUploadId, data.upload_id))
            break
        }
        case 'video.asset.track.ready': {
            const data = payload.data as VideoAssetTrackReadyWebhookEvent['data'] & {
                asset_id: string
            }

            // Typescript incorrenctly says that asset_id does not exist
            const assetId = data.asset_id
            const trackId = data.id
            const status = data.status

            if (!assetId) {
                return new Response("Missing asset ID", { status: 400 })
            }

            console.log('Track ready');

            await db
                .update(videos)
                .set({
                    muxTrackId: trackId,
                    muxTrackStatus: status
                })
                .where(eq(videos.muxAssetId, assetId))
            break

        }
    }

    return new Response('Webhook received', { status: 200 })
}