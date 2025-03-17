import { trpc, HydrateClient } from "@/trpc/server"
import { VideoView } from "@/modules/videos/ui/views/video-view"
import { DEFAULT_LIMIT } from "@/constants"

interface PageProps {
    params: Promise<{ videoId: string }>
}

const Page = async ({ params }: PageProps) => {
    const { videoId } = await params

    void await trpc.videos.getOne.prefetch({ id: videoId })
    void await trpc.comments.getMany.prefetchInfinite({ videoId, limit: DEFAULT_LIMIT })
    void await trpc.suggestions.getMany.prefetchInfinite({ videoId, limit: DEFAULT_LIMIT })

    return (
        <HydrateClient>
            <VideoView videoId={videoId} />
        </HydrateClient>
    )
}

export default Page