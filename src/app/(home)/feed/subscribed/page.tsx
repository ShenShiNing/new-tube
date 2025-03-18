import { DEFAULT_LIMIT } from "@/constants"
import { HydrateClient, trpc } from "@/trpc/server"
import { SubscribedView } from "@/modules/home/ui/views/subscribed-view"

const Page = async () => {
  void trpc.videos.getManySubscribed.prefetchInfinite({
    limit: DEFAULT_LIMIT,
  })


  return (
    <HydrateClient>
      <SubscribedView />
    </HydrateClient>
  )
}

export default Page