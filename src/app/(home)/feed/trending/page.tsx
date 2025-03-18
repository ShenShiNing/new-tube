import { DEFAULT_LIMIT } from "@/constants"
import { HydrateClient, trpc } from "@/trpc/server"
import { TrendingView } from "@/modules/home/ui/views/trending-view"

const Page = async () => {
  void trpc.videos.getManyTrending.prefetchInfinite({
    limit: DEFAULT_LIMIT,
  })


  return (
    <HydrateClient>
      <TrendingView />
    </HydrateClient>
  )
}

export default Page