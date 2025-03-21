import Link from "next/link"
import { VideoGetOneOutput } from "@/modules/videos/types"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@clerk/nextjs"
import { UserInfo } from "@/modules/users/ui/components/user-info"
import { useSubscription } from "@/modules/subscriptions/hooks/use-subscription"
import { SubscriptionButton } from "@/modules/subscriptions/ui/components/subscription-button"

interface VideoOwnerProps {
    user: VideoGetOneOutput["user"]
    videoId: string
}

export const VideoOwner = ({ user, videoId }: VideoOwnerProps) => {
    const { userId: clerkUserId, isLoaded } = useAuth()
    const { isPending, onClick } = useSubscription({
        userId: user.id,
        isSubscribed: user.viewerSubscribed,
        formVideoId: videoId
    })

    return (
        <div className="flex items-center sm:items-start justify-between sm:justify-start gap-3 min-w-0">
            <Link prefetch  href={`/users/${user.id}`}>
                <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar size="lg" imageUrl={user.imageUrl} name={user.name} />
                    <div className="flex flex-col min-w-0">
                        <UserInfo name={user.name} size="lg" />
                        <span className="text-sm text-muted-foreground line-clamp-1">
                            {user.subscriberCount} subscribers
                        </span>
                    </div>
                </div>
            </Link>
            {clerkUserId === user.clerId ? (
                <Button
                    asChild
                    variant="secondary"
                    className="rounded-full"
                >
                    <Link prefetch  href={`/studio/videos/${videoId}`}>
                        Edit video
                    </Link>
                </Button>
            ) : (
                <SubscriptionButton
                    onClick={onClick}
                    disabled={isPending || !isLoaded}
                    isSubscribed={user.viewerSubscribed}
                    className="flex-none"
                />
            )}
        </div>
    )
}