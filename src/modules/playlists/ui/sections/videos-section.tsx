"use client"

import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"

import { trpc } from "@/trpc/client"
import { DEFAULT_LIMIT } from "@/constants"
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card"
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card"
import { InfiniteScroll } from "@/components/infinite.scroll"
import { toast } from "sonner"
interface VideosSectionProps {
    playlistId: string
}

export const VideosSection = ({ playlistId }: VideosSectionProps) => {
    return (
        <Suspense fallback={<VideosSectionSkeleton />}>
            <ErrorBoundary fallback={<p>Error...</p>}>
                <VideosSectionSuspense playlistId={playlistId} />
            </ErrorBoundary>
        </Suspense>
    )
}

export const VideosSectionSkeleton = () => {
    return (
        <div>   
            <div className="flex flex-col gap-4 gap-y-10 md:hidden">
                {Array.from({ length: 18 }).map((_, index) => (
                    <VideoGridCardSkeleton key={index} />
                ))
                }
            </div>
            <div className="hidden flex-col gap-4 md:flex">
                {Array.from({ length: 18 }).map((_, index) => (
                    <VideoRowCardSkeleton key={index} size="compact" />
                ))
                }
            </div>
        </div>
    )
}

export const VideosSectionSuspense = ({ playlistId }: VideosSectionProps) => {
    const utils = trpc.useUtils()

    const [videos, query] = trpc.playlists.getVideos.useSuspenseInfiniteQuery({
        playlistId,
        limit: DEFAULT_LIMIT,
    }, {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    })

    const removeVideo = trpc.playlists.removeVideo.useMutation({
        onSuccess: (data) => {
            utils.playlists.getMany.invalidate()
            utils.playlists.getManyForVideo.invalidate({ videoId: data.videoId })
            utils.playlists.getOne.invalidate({ id: data.playlistId })
            utils.playlists.getVideos.invalidate({ playlistId: data.playlistId })
            toast.success("Video removed from playlist")
        },
        onError: () => {
            toast.error("Something went wrong")
        }
    })

    return (
        <div>
            <div className="flex flex-col gap-4 gap-y-10 md:hidden">
                {videos.pages
                    .flatMap((page) => page.items)
                    .map((video) => (
                        <VideoGridCard 
                            key={video.id} 
                            data={video} 
                            onRemove={() => removeVideo.mutate({ playlistId, videoId: video.id })}
                        />
                    ))
                }
            </div>
            <div className="hidden flex-col gap-4 gap-y-10 md:flex">
                {videos.pages
                    .flatMap((page) => page.items)
                    .map((video) => (
                        <VideoRowCard 
                            key={video.id} 
                            data={video} 
                            size="compact"
                            onRemove={() => removeVideo.mutate({ playlistId, videoId: video.id })}
                        />
                    ))
                }
            </div>
            <InfiniteScroll
                hasNextPage={query.hasNextPage}
                isFetchingNextPage={query.isFetchingNextPage}
                fetchNextPage={query.fetchNextPage}
            />
        </div>
    )
}
