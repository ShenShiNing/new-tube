import { trpc, HydrateClient } from "@/trpc/server"
import { VideoView } from "@/modules/videos/ui/views/video-view"

interface PageProps {
    params: Promise<{ videoId: string }>
}

const Page = async ({ params }: PageProps) => {
    const { videoId } = await params

    void await trpc.videos.getOne.prefetch({ id: videoId })

    return (
        <HydrateClient>
            <VideoView videoId={videoId} />
        </HydrateClient>
    )
}

export default Page