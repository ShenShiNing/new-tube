import { HydrateClient, trpc } from "@/trpc/server"
import { UserView } from "@/modules/users/ui/views/user-view"
import { DEFAULT_LIMIT } from "@/constants"

interface PageProps {
    params: Promise<{
        userId: string
    }>
}

export const dynamic = 'force-dynamic'

const Page = async ({ params }: PageProps) => {
    const { userId } = await params

    void trpc.users.getOne.prefetch({ id: userId })
    void trpc.videos.getMany.prefetchInfinite({userId, limit: DEFAULT_LIMIT})

    return (
        <HydrateClient>
            <UserView userId={userId} />
        </HydrateClient>
    )
}

export default Page