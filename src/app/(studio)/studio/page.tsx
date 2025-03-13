import { trpc, HydrateClient } from "@/trpc/server"
import { StudioView } from "@/modules/studio/ui/views/studio-view"
import { DEFAULT_LIMIT } from "@/constants"

const Page = async () => {
    void trpc.studio.getMany.prefetchInfinite({
        limit: DEFAULT_LIMIT,
    })

    return (
        <HydrateClient>
            <StudioView />
        </HydrateClient>
    )
}

export default Page